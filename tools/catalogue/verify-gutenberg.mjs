// Checks every Gutenberg book (SR-B2534 and up) that has an uploaded PDF: does the store's
// title match the title its file was built for? Reads the catalogue 100 books at a time.
//
//   node verify-gutenberg.mjs
//
// Writes gutenberg-verify-mismatch.tsv. Changes nothing in the store.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'https://www.thesunrisebookstore.com';
const here = path.dirname(fileURLToPath(import.meta.url));
const THROTTLE_WAITS = [15000, 30000, 60000, 120000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const skuNum = (s) => (/^SR-B(\d+)$/i.exec(s) ? Number(RegExp.$1) : null);

const auth = JSON.parse(fs.readFileSync(path.join(here, 'auth.json'), 'utf8').replace(/^﻿/, ''));
const expected = JSON.parse(fs.readFileSync(path.join(here, 'gutenberg-titles.json'), 'utf8'));
let token = null;

async function signIn() {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${STORE}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: auth.email, password: auth.password }),
    });
    if (res.ok) { token = (await res.json()).token; return true; }
    await sleep(THROTTLE_WAITS[Math.min(attempt, 3)]);
  }
  return false;
}

async function page(n) {
  for (let throttles = 0; ; ) {
    const res = await fetch(`${STORE}/api/admin/books?limit=100&page=${n}`, {
      headers: { Cookie: `flemela_admin_session=${token}`, Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) { await signIn(); continue; }
    if (res.status === 429 || res.status >= 500) { await sleep(THROTTLE_WAITS[Math.min(throttles++, 3)]); continue; }
    return (await res.json()).products || [];
  }
}

if (!(await signIn())) { console.error('Could not sign in.'); process.exit(1); }

let withFile = 0, match = 0, unknown = 0;
const mismatches = [];
for (let n = 1; ; n++) {
  const books = await page(n);
  if (!books.length) break;
  for (const b of books) {
    const num = skuNum(b.sku);
    if (num === null || num < 2534) continue;
    const pdf = (b.formats || []).find((f) => f.format === 'pdf');
    if (!pdf || !String(pdf.file_public_id || '').startsWith('ebooks/')) continue;
    withFile++;
    const want = expected[b.sku];
    if (!want) unknown++;
    else if (norm(want) === norm(b.name)) match++;
    else mismatches.push(`${b.sku}\t${b.name}\t${want}`);
  }
  if (n % 100 === 0) console.log(`page ${n}: ${withFile} Gutenberg eBooks checked, ${mismatches.length} mismatched`);
  await sleep(700);
}

fs.writeFileSync(path.join(here, 'gutenberg-verify-mismatch.tsv'), 'SKU\tstore title\tfile built for\n' + mismatches.join('\n') + '\n');
console.log(`\nGutenberg eBooks with a file: ${withFile}`);
console.log(`  title matches the file  : ${match}`);
console.log(`  MISMATCHED              : ${mismatches.length}`);
console.log(`  no expected title known : ${unknown}`);
