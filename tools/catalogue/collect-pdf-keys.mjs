// Walks the public catalogue and records, for every book, the storage key of its PDF.
// Writes pdf-keys.json ({ SKU: key }) for the CSV backfill, and reports books whose
// PDF entry holds a bare filename instead of a real uploaded file.
//
//   node collect-pdf-keys.mjs [outfile]

import fs from 'node:fs';

const STORE = 'https://www.thesunrisebookstore.com';
const out = process.argv[2] || 'pdf-keys.json';
const PAGE = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const keys = {};
const broken = [];
let page = 1, seen = 0, total = null, noPdf = 0;

while (true) {
  let data;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${STORE}/api/products?limit=${PAGE}&page=${page}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      break;
    } catch (err) {
      if (attempt === 2) throw err;
      await sleep(3000);
    }
  }
  const products = data.products || [];
  if (total === null) total = data.total;
  if (!products.length) break;

  for (const p of products) {
    seen++;
    const pdf = (p.formats || []).find((f) => f.format === 'pdf');
    if (!pdf) { noPdf++; continue; }
    const key = String(pdf.file_public_id || '');
    if (key.startsWith('ebooks/')) keys[p.sku] = key;
    else if (key) broken.push(`${p.sku}\t${p.name}\t${key}`);
  }

  if (page % 25 === 0) console.log(`page ${page}: ${seen}/${total} books, ${Object.keys(keys).length} with real files, ${broken.length} broken`);
  if (seen >= total) break;
  page++;
  await sleep(300);
}

fs.writeFileSync(out, JSON.stringify(keys));
fs.writeFileSync('broken-pdf-entries.tsv', 'SellerSKU\tName\tbad value\n' + broken.join('\n') + '\n');
console.log(`\nchecked ${seen} books`);
console.log(`  downloadable (real file): ${Object.keys(keys).length}`);
console.log(`  broken (bare filename)  : ${broken.length}`);
console.log(`  no PDF option           : ${noPdf}`);
console.log(`keys written to ${out}; broken list to broken-pdf-entries.tsv`);
