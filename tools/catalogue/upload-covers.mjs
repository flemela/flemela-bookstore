// tools/catalogue/upload-covers.mjs
// Uploads generated covers (SR-Bxxxx.jpg) to Cloudflare R2 and sets them as the book's image,
// only for books that have NO image, and only when the store title is the one the cover
// was generated for. Direct presigned R2 PUT upload, then PATCH images with public R2 CDN link.
//
//   node upload-covers.mjs <coversDir> [--dry-run] [--limit N] [--replace-existing]
//
// Needs auth.json, store-snapshot.json (from backfill-csvs.mjs) and gutenberg-titles.json.
// Ledger: covers-done.tsv (resumes); failures: covers-failed.tsv.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'https://www.thesunrisebookstore.com';
const here = path.dirname(fileURLToPath(import.meta.url));
const [dir, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const replaceExisting = flags.includes('--replace-existing');
const limitArg = flags.indexOf('--limit');
const limit = limitArg >= 0 ? Number(flags[limitArg + 1]) : Infinity;

const GAP_MS = 1000;
const THROTTLE_WAITS = [15000, 30000, 60000, 120000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const at = (f) => path.join(here, f);

const auth = JSON.parse(fs.readFileSync(at('auth.json'), 'utf8').replace(/^\uFEFF/, ''));
const store = JSON.parse(fs.readFileSync(at('store-snapshot.json'), 'utf8'));
const titles = JSON.parse(fs.readFileSync(at('gutenberg-titles.json'), 'utf8'));
let token = null;

async function signIn() {
  for (let a = 0; a < 6; a++) {
    const res = await fetch(`${STORE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: auth.email, password: auth.password }),
    });
    if (res.ok) {
      token = (await res.json()).token;
      return true;
    }
    await sleep(THROTTLE_WAITS[Math.min(a, 3)]);
  }
  return false;
}

async function api(pathname, options = {}) {
  for (let t = 0, e = 0; ; ) {
    const res = await fetch(`${STORE}${pathname}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: `flemela_admin_session=${token}`,
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (res.status === 401 || res.status === 403) {
      if (await signIn()) continue;
      throw new Error('sign-in failed');
    }
    if (res.status === 429) {
      await sleep(THROTTLE_WAITS[Math.min(t++, 3)]);
      continue;
    }
    if (res.status >= 500 && e++ < 2) {
      await sleep(3000);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${pathname}`);
    return res.status === 204 ? null : res.json();
  }
}

async function uploadToR2(filePath, sku) {
  const ext = path.extname(filePath).replace('.', '').toLowerCase() || 'jpg';
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const bytes = fs.readFileSync(filePath);

  const slot = await api('/api/admin/upload-signature', {
    method: 'POST',
    body: JSON.stringify({
      target: 'products',
      filename: `${sku}.${ext}`,
      contentType: mime,
    }),
  });

  if (!slot?.uploadUrl || !slot?.publicUrl) {
    throw new Error('Could not acquire R2 presigned upload URL from store');
  }

  const put = await fetch(slot.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mime },
    body: bytes,
  });

  if (!put.ok) {
    throw new Error(`R2 upload rejected with HTTP ${put.status}`);
  }

  return { publicUrl: slot.publicUrl, key: slot.key };
}

// ---------- plan ----------
const doneFile = at('covers-done.tsv');
const done = new Set(
  fs.existsSync(doneFile)
    ? fs
        .readFileSync(doneFile, 'utf8')
        .split('\n')
        .map((l) => l.split('\t')[0])
        .filter(Boolean)
    : []
);

const plan = [];
const skipped = { notInStore: 0, hasCover: 0, titleDiffers: 0, done: 0 };

for (const f of fs.readdirSync(dir).filter((x) => /^SR-B\d+\.jpg$/i.test(x)).sort()) {
  const sku = f.replace(/\.jpg$/i, '').toUpperCase();
  const b = store[sku];
  if (done.has(sku)) {
    skipped.done++;
    continue;
  }
  if (!b) {
    skipped.notInStore++;
    continue;
  }
  if (!titles[sku] || norm(titles[sku]) !== norm(b.name)) {
    skipped.titleDiffers++;
    continue;
  }
  if (b.images?.length && !replaceExisting) {
    skipped.hasCover++;
    continue;
  }
  plan.push({ sku, id: b.id, name: b.name, file: path.join(dir, f) });
}

console.log(
  `to upload: ${plan.length} | skipped: already has a cover ${skipped.hasCover}, not in store ${skipped.notInStore}, title differs ${skipped.titleDiffers}, done earlier ${skipped.done}`
);

if (dryRun) {
  plan.slice(0, 5).forEach((p) => console.log(`  ${p.sku}  "${p.name}"`));
  process.exit(0);
}

if (!(await signIn())) {
  console.error('Could not sign in.');
  process.exit(1);
}

// ---------- upload ----------
let ok = 0;
let failed = 0;
let n = 0;

for (const p of plan.slice(0, limit)) {
  n++;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { publicUrl, key } = await uploadToR2(p.file, p.sku);

      await api(`/api/admin/books/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          images: [{ image_url: publicUrl, image_public_id: key }],
        }),
      });

      fs.appendFileSync(doneFile, `${p.sku}\t${p.name}\t${publicUrl}\n`);
      ok++;
      break;
    } catch (err) {
      if (attempt === 2) {
        fs.appendFileSync(at('covers-failed.tsv'), `${p.sku}\t${p.name}\t${err.message}\n`);
        failed++;
      } else {
        await sleep(3000);
      }
    }
  }

  if (n % 50 === 0) console.log(`${n}/${plan.length} - uploaded ${ok}, failed ${failed}`);
  await sleep(GAP_MS);
}

console.log(`\ncovers finished: ${ok} uploaded and set, ${failed} failed`);