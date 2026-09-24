// Task 4: make the catalogue CSVs record what the store actually sells, so a re-import
// can never wipe the attached eBooks.
//
//   node backfill-csvs.mjs [--dry-run]
//
// 1. Reads the whole store catalogue (SKU, title, price, PDF key, cover).
// 2. Gutenberg CSVs (SKUs agree with the store): writes each book's storage key into its
//    PDF FILE column - only where the CSV title matches the store title.
// 3. Legacy "E-Books Catalog.csv" (SKUs do NOT agree with the store): left untouched.
//    A corrected copy is generated from the store instead.
// Every CSV is backed up before it is changed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'https://www.thesunrisebookstore.com';
const here = path.dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes('--dry-run');
const THROTTLE_WAITS = [15000, 30000, 60000, 120000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const skuNum = (s) => (/^SR-B(\d+)$/i.exec(s) ? Number(RegExp.$1) : null);

const GUTENBERG_DIRS = [
  'C:/Users/The SunRise/Documents/flemela-bookstore/.claude/import',
  'C:/BOOKS/E-Books/Gutenberg Catalog/ASCII for import',
];
const LEGACY_CSV = 'C:/BOOKS/E-Books/E-Books Catalog.csv';
const LEGACY_OUT = 'C:/BOOKS/E-Books/E-Books Catalog (matches store).csv';
const BACKUP = `C:/BOOKS/tools/csv-backup-${new Date().toISOString().slice(0, 10)}`;

// ---------- csv ----------
function parse(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}
const cell = (v) => { v = v == null ? '' : String(v); return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
const write = (file, rows, bom) => fs.writeFileSync(file, (bom ? '\uFEFF' : '') + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n', 'utf8');

// ---------- store ----------
const auth = JSON.parse(fs.readFileSync(path.join(here, 'auth.json'), 'utf8').replace(/^\uFEFF/, ''));
let token = null;
async function signIn() {
  for (let a = 0; a < 6; a++) {
    const res = await fetch(`${STORE}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: auth.email, password: auth.password }) });
    if (res.ok) { token = (await res.json()).token; return true; }
    await sleep(THROTTLE_WAITS[Math.min(a, 3)]);
  }
  return false;
}
async function page(n) {
  for (let t = 0; ; ) {
    const res = await fetch(`${STORE}/api/admin/books?limit=100&page=${n}`, { headers: { Cookie: `flemela_admin_session=${token}`, Authorization: `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) { await signIn(); continue; }
    if (res.status === 429 || res.status >= 500) { await sleep(THROTTLE_WAITS[Math.min(t++, 3)]); continue; }
    return (await res.json()).products || [];
  }
}

if (!(await signIn())) { console.error('Could not sign in.'); process.exit(1); }
console.log('reading the store catalogue (about 15 minutes)...');
const store = {};
for (let n = 1; ; n++) {
  const books = await page(n);
  if (!books.length) break;
  for (const b of books) store[b.sku] = b;
  if (n % 100 === 0) console.log(`  page ${n}: ${Object.keys(store).length} books`);
  await sleep(600);
}
console.log(`${Object.keys(store).length} books read`);
fs.writeFileSync(path.join(here, 'store-snapshot.json'), JSON.stringify(store));

const pdfOf = (b) => (b?.formats || []).find((f) => f.format === 'pdf') || null;
const realKey = (b) => { const p = pdfOf(b); return p && String(p.file_public_id || '').startsWith('ebooks/') ? p.file_public_id : ''; };

// ---------- 1. Gutenberg CSVs ----------
if (!dryRun) fs.mkdirSync(BACKUP, { recursive: true });
let filled = 0, cleared = 0, titleDisagrees = 0, files = 0;
for (const dir of GUTENBERG_DIRS) {
  for (const name of fs.readdirSync(dir).filter((f) => /\.csv$/i.test(f))) {
    const file = path.join(dir, name);
    const raw = fs.readFileSync(file, 'utf8');
    const bom = raw.startsWith('\uFEFF');
    const rows = parse(bom ? raw.slice(1) : raw);
    const iS = rows[0].indexOf('SellerSKU'), iN = rows[0].indexOf('Name'), iP = rows[0].indexOf('PDF FILE');
    if (iS < 0 || iP < 0) continue;
    let changed = 0;
    for (const r of rows.slice(1)) {
      const b = store[r[iS]];
      if (!b) continue;
      if (norm(b.name) !== norm(r[iN])) { titleDisagrees++; continue; }   // never write across a mismatch
      const key = realKey(b);
      if (key && r[iP] !== key) { r[iP] = key; changed++; filled++; }
    }
    if (changed) {
      files++;
      if (!dryRun) {
        const sub = path.join(BACKUP, path.basename(dir));
        fs.mkdirSync(sub, { recursive: true });
        fs.copyFileSync(file, path.join(sub, name));
        write(file, rows, bom);
      }
    }
  }
}
console.log(`\nGutenberg CSVs: ${filled} rows given their storage key, in ${files} files` + (titleDisagrees ? ` (${titleDisagrees} rows skipped: title differs from store)` : ''));

// ---------- 2. Legacy catalogue, rebuilt from the store ----------
const legacyRaw = fs.readFileSync(LEGACY_CSV, 'utf8');
const legacyBom = legacyRaw.startsWith('\uFEFF');
const header = parse(legacyBom ? legacyRaw.slice(1) : legacyRaw)[0];
const col = (h) => header.indexOf(h);
const legacy = Object.values(store)
  .filter((b) => { const n = skuNum(b.sku); return n !== null && n >= 1 && n <= 2533; })
  .sort((a, b) => skuNum(a.sku) - skuNum(b.sku));
const out = [header];
let withFile = 0;
for (const b of legacy) {
  const r = new Array(header.length).fill('');
  const hard = (b.formats || []).find((f) => f.format === 'hardcopy');
  const pdf = pdfOf(b);
  const key = realKey(b);
  if (key) withFile++;
  r[col('Name')] = b.name;
  r[col('Description')] = b.description || '';
  r[col('SellerSKU')] = b.sku;
  r[col('PrimaryCategory')] = b.category?.name || b.category_name || b.primary_category || '';
  r[col('Price_KES')] = hard ? hard.price : '';
  r[col('Sale_Price_KES')] = hard?.compare_at_price || '';
  r[col('PDF FILE')] = key;                      // blank = no eBook on sale
  r[col('PDFS PRICE')] = key && pdf ? pdf.price : '';
  r[col('Stock')] = hard?.stock ?? '';
  r[col('author')] = b.author || '';
  r[col('Image 1')] = b.images?.[0]?.image_url || '';
  r[col('Image 2')] = b.images?.[1]?.image_url || '';
  out.push(r);
}
if (!dryRun) write(LEGACY_OUT, out, legacyBom);
console.log(`Legacy catalogue: ${legacy.length} books written to "${path.basename(LEGACY_OUT)}", ${withFile} with an eBook file. Original left untouched.`);
if (!dryRun) console.log(`Backups of every changed CSV: ${BACKUP}`);
