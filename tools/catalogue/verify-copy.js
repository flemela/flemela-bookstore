// Compares every file in two folder trees by SHA-1 and reports damage.
// Usage: node verify-copy.js <sourceDir> <copyDir> <report.tsv>
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [, , srcRoot, dstRoot, report] = process.argv;

function walk(dir, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
    else if (e.isFile()) out.push(rel);
  }
  return out;
}

function hash(file) {
  return new Promise((resolve) => {
    const h = crypto.createHash('sha1');
    const s = fs.createReadStream(file);
    s.on('error', (err) => resolve({ error: err.code }));
    s.on('data', (d) => h.update(d));
    s.on('end', () => resolve({ digest: h.digest('hex') }));
  });
}

(async () => {
  const files = walk(srcRoot);
  const lines = ['relative path\tproblem'];
  let ok = 0, missing = 0, unreadable = 0, different = 0, n = 0;
  for (const rel of files) {
    n++;
    const dst = path.join(dstRoot, rel);
    if (!fs.existsSync(dst)) { lines.push(`${rel}\tmissing from copy`); missing++; continue; }
    const [a, b] = await Promise.all([hash(path.join(srcRoot, rel)), hash(dst)]);
    if (b.error) { lines.push(`${rel}\tunreadable on copy (${b.error})`); unreadable++; }
    else if (a.error) { lines.push(`${rel}\tunreadable on source (${a.error})`); unreadable++; }
    else if (a.digest !== b.digest) { lines.push(`${rel}\tcontents differ`); different++; }
    else ok++;
    if (n % 500 === 0) console.log(`${n}/${files.length} checked - ok ${ok}, damaged ${missing + unreadable + different}`);
  }
  fs.writeFileSync(report, lines.join('\n') + '\n');
  console.log(`DONE ${n} files: ok ${ok}, missing ${missing}, unreadable ${unreadable}, different ${different}`);
  console.log(`report: ${report}`);
})();
