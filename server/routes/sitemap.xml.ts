// server/routes/sitemap.xml.ts
// =============================================================================
// Dynamic Search Engine XML Sitemap Generator
// Automatically crawls all published book titles and outputs a valid XML sitemap
// =============================================================================

import { sokoClient } from '../utils/sokoClient';
import type { Book } from '~/types';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = 'https://www.thesunrisebookstore.com';
  const storeSlug = config.public.storeSlug || 'flemela';

  let books: Book[] = [];
  try {
    const fetchedBooks = await sokoClient<Book[]>(`/public/stores/${storeSlug}/products`);
    books = fetchedBooks || [];
  } catch {
    books = [];
  }

  const currentDate = new Date().toISOString().split('T')[0];

  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
    {
      loc: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0',
    },
  ];

  for (const book of books) {
    if (book.slug) {
      const updatedAt = book.updated_at
        ? new Date(book.updated_at).toISOString().split('T')[0]
        : currentDate;

      urls.push({
        loc: `${baseUrl}/book/${book.slug}`,
        lastmod: updatedAt,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }
  }

  const xmlEntries = urls
    .map((item) => `
  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=7200');

  return xml;
});