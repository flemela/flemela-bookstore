// Takes the eBook option off sale for books whose PDF entry points at a file that was
// never uploaded, so a customer cannot pay for a download that fails. Reversible: when
// attach-pdfs.mjs uploads the real file it sets the format up again.
//
//   node hide-broken-ebooks.mjs broken-pdf-entries.tsv [--dry-run] [--limit N]
//
// Auth: auth.json next to this script (see attach-pdfs.mjs).
// Every removal is recorded in hidden-ebooks.tsv so it can be undone or audited.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'https://www.thesunrisebookstore.com';
const here = path.dirname(fileURLToPath(import.meta.url));
const [listFile, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const limitArg = flags.indexOf('--limit');
const limit = limitArg >= 0 ? Number(flags[limitArg + 1]) : Infinity;
const ledger = path.join(here, 'hidden-ebooks.tsv');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const THROTTLE_WAITS = [15000, 30000, 60000, 120000];

let token = null, credentials = null;
try {
  // PowerShell's Set-Content writes a byte-order mark that JSON.parse chokes on.
  const auth = JSON.parse(fs.readFileSync(path.join(here, 'auth.json'), 'utf8').replace(/^﻿/, ''));
  token = auth.token || null;
  if (auth.email && auth.password) credentials = { email: auth.email, password: auth.password };
} catch {
  console.error('No auth.json next to this script.');
  process.exit(1);
}

async function signIn() {
  if (!credentials) return false;
  // A throttled login is not a wrong password: wait it out instead of stopping the run.
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${STORE}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials),
    });
    if (res.ok) {
      token = (await res.json()).token;
      return Boolean(token);
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(THROTTLE_WAITS[Math.min(attempt, THROTTLE_WAITS.length - 1)]);
      continue;
    }
    console.error(`login rejected with HTTP ${res.status} - check auth.json`);
    return false;
  }
  return false;
}

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
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 140)}`);
  return res.status === 204 ? null : res.json();
}

const rows = fs.readFileSync(listFile, 'utf8').split('\n').slice(1).filter(Boolean);
const already = new Set(
  fs.existsSync(ledger) ? fs.readFileSync(ledger, 'utf8').split('\n').map((l) => l.split('\t')[0]).filter(Boolean) : []
);
const todo = rows.map((r) => r.split('\t')).filter(([sku]) => sku && !already.has(sku));

console.log(`${rows.length} broken eBook entries, ${already.size} already hidden, ${todo.length} to hide`);
if (dryRun) {
  console.log('dry run. First 5:', todo.slice(0, 5).map((r) => `${r[0]} ${r[1]}`).join(' | '));
  process.exit(0);
}
if (!token && !(await signIn())) { console.error('Could not sign in.'); process.exit(1); }

let hidden = 0, failed = 0, n = 0;
for (const [sku, name, badValue] of todo.slice(0, limit)) {
  n++;
  let attempt = 0, throttles = 0;
  while (attempt < 3) {
    try {
      const data = await api(`/api/admin/books?q=${encodeURIComponent(sku)}&limit=5`);
      const book = (data.products || []).find((p) => String(p.sku).toUpperCase() === sku);
      const pdf = book ? (book.formats || []).find((f) => f.format === 'pdf') : null;
      if (!book || !pdf) { console.log(`${sku}: nothing to hide`); break; }
      if (String(pdf.file_public_id || '').startsWith('ebooks/')) { console.log(`${sku}: already has a real file, left alone`); break; }

      await api(`/api/admin/books/${book.id}/formats/${pdf.id}`, { method: 'DELETE' });
      fs.appendFileSync(ledger, `${sku}\t${name}\t${pdf.price}\t${badValue}\n`);
      hidden++;
      break;
    } catch (err) {
      if (err instanceof Unauthorized) {
        if (await signIn()) continue;
        console.error('Session expired and re-login failed. Re-run to continue.');
        process.exit(1);
      }
      if (err instanceof Throttled) { await sleep(THROTTLE_WAITS[Math.min(throttles++, 3)]); continue; }
      if (++attempt >= 3) { console.log(`${sku}: FAILED - ${err.message}`); failed++; }
      else await sleep(2000);
    }
  }
  if (n % 25 === 0) console.log(`${n}/${todo.length} - hidden ${hidden}, failed ${failed}`);
  await sleep(400);
}

console.log(`done: hidden ${hidden}, failed ${failed}. Ledger: ${ledger}`);
