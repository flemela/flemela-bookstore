// Attaches SKU-named PDFs to books in the store: upload to R2, then point the book's
// PDF format at the uploaded file. Does the same work as the admin Bulk Files page, but
// from the command line, so it survives closed tabs and restarts.
//
//   node attach-pdfs.mjs <folder of SR-Bxxxx.pdf> [--limit N] [--dry-run]
//
// Auth (never passed on the command line, never printed):
//   auth.json next to this script:  { "email": "...", "password": "..." }   <- renews itself hourly
//   or  { "token": "..." }                                                  <- expires after an hour
//
// Progress is appended to <folder>/../attach-progress.tsv, so a re-run skips finished books.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'https://www.thesunrisebookstore.com';
const here = path.dirname(fileURLToPath(import.meta.url));
const [folder, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const limitArg = flags.indexOf('--limit');
const limit = limitArg >= 0 ? Number(flags[limitArg + 1]) : Infinity;

if (!folder) {
  console.error('usage: node attach-pdfs.mjs <folder> [--limit N] [--dry-run]');
  process.exit(1);
}

// SKU -> the title each file was built for. Before attaching, the store's title for that
// SKU must match it: matching on SKU alone once put the wrong book on ~1,000 products.
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const titlesArg = flags.indexOf('--titles');
const expectedTitle = titlesArg >= 0 ? JSON.parse(fs.readFileSync(flags[titlesArg + 1], 'utf8')) : null;
if (!expectedTitle && !flags.includes('--no-title-check')) {
  console.error('Pass --titles <sku-to-title.json> so each book is checked before its file is attached.');
  process.exit(1);
}

const progressFile = path.join(folder, '..', 'attach-progress.tsv');
const failureFile = path.join(folder, '..', 'attach-failures.tsv');
const keysFile = path.join(here, 'pdf-keys.json');

// The store refuses bursts. 400ms earned repeated 2-minute penalties, which cost far more
// than the extra wait, so go steadier.
const GAP_MS = 1000;
const THROTTLE_WAITS = [15000, 30000, 60000, 120000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- auth ----------
let token = null;
let credentials = null;
try {
  // PowerShell's Set-Content writes a byte-order mark that JSON.parse chokes on.
  const auth = JSON.parse(fs.readFileSync(path.join(here, 'auth.json'), 'utf8').replace(/^﻿/, ''));
  if (auth.token) token = auth.token;
  if (auth.email && auth.password) credentials = { email: auth.email, password: auth.password };
} catch {
  console.error('No auth.json found next to this script. Create it with {"email":"...","password":"..."} or {"token":"..."}');
  process.exit(1);
}

async function signIn() {
  if (!credentials) return false;
  // Signing in can be throttled too. A "slow down" is not a wrong password, so wait it
  // out rather than abandoning the run, as an earlier version did after 795 books.
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${STORE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (res.ok) {
      token = (await res.json()).token;
      console.log('signed in; token renewed');
      return Boolean(token);
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = THROTTLE_WAITS[Math.min(attempt, THROTTLE_WAITS.length - 1)];
      console.log(`login refused (HTTP ${res.status}); waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    console.error(`login rejected with HTTP ${res.status} - check auth.json`);
    return false;
  }
  return false;
}

// ---------- store calls ----------
class Unauthorized extends Error {}
class Throttled extends Error {}

async function api(pathname, options = {}) {
  const res = await fetch(`${STORE}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `flemela_admin_session=${token}`,
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (res.status === 401 || res.status === 403) throw new Unauthorized();
  if (res.status === 429) throw new Throttled();
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${pathname}: ${(await res.text()).slice(0, 160)}`);
  return res.json();
}

async function findBook(sku) {
  const data = await api(`/api/admin/books?q=${encodeURIComponent(sku)}&limit=5`);
  const book = (data.products || []).find((p) => String(p.sku || '').toUpperCase() === sku);
  if (!book) return null;
  const pdf = (book.formats || []).find((f) => f.format === 'pdf');
  return {
    id: book.id,
    name: book.name,
    formatId: pdf?.id || null,
    price: pdf ? Number(pdf.price) : null,
    // A key like "ebooks/…" means a real uploaded file; a bare filename is the broken legacy value.
    storedKey: String(pdf?.file_public_id || '').startsWith('ebooks/') ? pdf.file_public_id : null,
    storedSize: pdf?.file_size_bytes ? Number(pdf.file_size_bytes) : null,
  };
}

async function attach(book, file, bytes) {
  const slot = await api('/api/admin/books/upload-url', {
    method: 'POST',
    body: JSON.stringify({ filename: path.basename(file), format: 'pdf', contentType: 'application/pdf' }),
  });
  const put = await fetch(slot.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: bytes,
  });
  if (!put.ok) throw new Error(`R2 upload returned HTTP ${put.status}`);

  const fields = { file_url: slot.fileUrl || slot.key, file_public_id: slot.key, file_size_bytes: bytes.length };
  if (book.formatId) {
    await api(`/api/admin/books/${book.id}/formats/${book.formatId}`, {
      method: 'PATCH',
      body: JSON.stringify({ price: book.price ?? 100, ...fields }),
    });
  } else {
    await api(`/api/admin/books/${book.id}/formats`, {
      method: 'POST',
      body: JSON.stringify({ format: 'pdf', price: 100, ...fields }),
    });
  }
  return slot.key;
}

// ---------- run ----------
const done = new Set();
if (fs.existsSync(progressFile)) {
  for (const line of fs.readFileSync(progressFile, 'utf8').split('\n')) {
    const sku = line.split('\t')[0];
    if (sku) done.add(sku);
  }
}

const files = fs
  .readdirSync(folder)
  .filter((f) => /^SR-B\d+\.pdf$/i.test(f))
  .sort();
const todo = files.filter((f) => !done.has(f.replace(/\.pdf$/i, '')));

console.log(`${files.length} PDFs in folder, ${done.size} already attached, ${todo.length} to do`);
if (dryRun) {
  console.log('dry run: nothing uploaded. First 5 pending:', todo.slice(0, 5).join(', '));
  process.exit(0);
}

if (!token && !(await signIn())) {
  console.error('Could not sign in. Check auth.json.');
  process.exit(1);
}

const keys = fs.existsSync(keysFile) ? JSON.parse(fs.readFileSync(keysFile, 'utf8')) : {};
let attached = 0, failed = 0, n = 0;
const started = Date.now();

for (const file of todo.slice(0, limit)) {
  const sku = file.replace(/\.pdf$/i, '').toUpperCase();
  n++;
  let throttles = 0, attempt = 0;

  while (attempt < 3) {
    try {
      const book = await findBook(sku);
      if (!book) {
        fs.appendFileSync(failureFile, `${sku}\tno book with this SKU in the store\n`);
        failed++;
        break;
      }
      if (expectedTitle) {
        const want = expectedTitle[sku];
        if (!want || norm(want) !== norm(book.name)) {
          fs.appendFileSync(failureFile, `${sku}\ttitle mismatch: store has "${book.name}", file is for "${want || 'unknown'}"\n`);
          failed++;
          break;
        }
      }
      const bytes = fs.readFileSync(path.join(folder, file));
      if (book.storedKey && book.storedSize === bytes.length) {
        // Already attached (e.g. by an earlier run in the browser) - record it and move on.
        fs.appendFileSync(progressFile, `${sku}\t${book.storedKey}\t${bytes.length}\tskipped, already attached\n`);
        keys[sku] = book.storedKey;
        break;
      }
      const key = await attach(book, file, bytes);
      fs.appendFileSync(progressFile, `${sku}\t${key}\t${bytes.length}\n`);
      keys[sku] = key;
      attached++;
      break;
    } catch (err) {
      if (err instanceof Unauthorized) {
        if (await signIn()) continue;            // token expired: renew and retry the same book
        console.error('Session expired and could not sign in again. Stopping; re-run to continue.');
        process.exit(1);
      }
      if (err instanceof Throttled) {
        const wait = THROTTLE_WAITS[Math.min(throttles++, THROTTLE_WAITS.length - 1)];
        console.log(`store asked us to slow down; waiting ${wait / 1000}s`);
        await sleep(wait);
        continue;                                 // a refusal to serve is not this book's fault
      }
      if (++attempt >= 3) {
        fs.appendFileSync(failureFile, `${sku}\t${String(err.message).slice(0, 200)}\n`);
        failed++;
      } else {
        await sleep(2000);
      }
    }
  }

  if (n % 25 === 0 || n === todo.length) {
    const perBook = (Date.now() - started) / n / 1000;
    const left = Math.round(((todo.length - n) * perBook) / 60);
    console.log(`${n}/${todo.length} - attached ${attached}, failed ${failed}, ~${left} min left`);
    fs.writeFileSync(keysFile, JSON.stringify(keys));
  }
  await sleep(GAP_MS);
}

fs.writeFileSync(keysFile, JSON.stringify(keys));
console.log(`finished: attached ${attached}, failed ${failed}`);
console.log(`progress ledger: ${progressFile}`);
if (failed) console.log(`failures: ${failureFile}`);
