# Catalogue tools

Command-line scripts for attaching eBook PDFs and covers to books in the live store, and for
checking that what the store sells matches the files. They do the same work as the admin
**Bulk eBook & Cover Upload** page, but run unattended, pace themselves under the store's rate
limit, sign back in when the hourly token expires, and resume from a ledger after any stop.

Run with Node 20+. Nothing here is part of the Nuxt app or its build.

## Sign-in

Each script reads `auth.json` from its own folder:

```json
{ "email": "admin@example.com", "password": "..." }
```

`auth.json` is git-ignored. Create it only on the machine running the scripts, and delete it
when you're done.

## The one rule: match by title, never by SKU alone

The legacy `E-Books Catalog.csv` numbers its books differently from the store. Matching files
by SKU once attached the wrong PDF to about 1,000 books. Every script that writes to the store
now confirms that the store's title is the title the file was made for, before attaching it.

## Scripts

| Script | What it does | Writes to the store? |
|---|---|---|
| `attach-pdfs.mjs <folder> --titles <map.json>` | Upload `SR-Bxxxx.pdf` files and attach each to its book, after a title check | yes |
| `upload-covers.mjs <folder>` | Upload `SR-Bxxxx.jpg` covers to Cloudinary and set them on books that have **no** image | yes |
| `repair-all.mjs [--verify]` | Put the right PDF on every legacy title by exact title match; `--verify` re-reads and checks each one | yes |
| `hide-broken-ebooks.mjs <list.tsv>` | Take the eBook option off books whose file is missing, so no one pays for a failed download | yes |
| `fast-audit.mjs` / `audit-legacy.mjs` | Find legacy books carrying a PDF for a different title, and take them off sale | yes |
| `verify-gutenberg.mjs` | Check every Gutenberg eBook's title against its file | no |
| `backfill-csvs.mjs` | Write each book's storage key into the catalogue CSVs; rebuild the legacy catalogue from the store | CSVs only |
| `collect-pdf-keys.mjs` | List every PDF key visible in the public catalogue | no |
| `verify-copy.js <src> <dst> <report>` | Hash two folder trees and report damaged copies | no |
| `serve-batch.js <folder> [port]` | Serve a folder of PDFs on 127.0.0.1 for the admin page | no |

Use `--dry-run` first where a script offers it. `repair-by-title.mjs` is the earlier,
slower form of `repair-all.mjs`.

## Paths

Several scripts have one-off paths from the 2026-09 catalogue work written into them: the
`C:\BOOKS` folders, and a session folder holding `legacy-pdf-rows.json` and
`legacy-file-map.json`. Adjust them before reusing a script elsewhere.
