// Serves one PDF batch folder to the store's admin page on this machine only (127.0.0.1).
// Usage: node serve-batch.js <folder> [port]
const http = require('http');
const fs = require('fs');
const path = require('path');
const [, , dir, port = '8765'] = process.argv;
const ORIGIN = 'https://www.thesunrisebookstore.com';

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') return res.end();
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/list') {
    const names = fs.readdirSync(dir).filter((f) => /^SR-B\d+\.pdf$/i.test(f)).sort();
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(names));
  }
  const name = path.basename(url);
  const file = path.join(dir, name);
  if (!/^SR-B\d+\.pdf$/i.test(name) || !fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', 'application/pdf');
  // A flaky external disk can fail mid-read; answer 500 for that one file instead of dying.
  const stream = fs.createReadStream(file);
  stream.on('error', (err) => {
    console.error(`read failed for ${name}: ${err.code}`);
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  });
  stream.pipe(res);
}).listen(Number(port), '127.0.0.1', () => console.log(`serving ${dir} on http://127.0.0.1:${port}`));
