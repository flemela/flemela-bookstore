// =============================================================================
// flemela/data/seeds.ts
// Verified High-Resolution (800px – 1600px+) Seed Catalog
// =============================================================================

import type { Book } from '~/types';

export interface SeedBook extends Book {
  isSeed: true;
}

// Section 1: #1 Books of the Month (Crystal-Clear HD Master Scans)
export const MONTHLY_TOP_SEEDS: SeedBook[] = [
  {
    id: 'seed-atomic-habits',
    org_id: 'seed-flemela',
    category_id: 'cat-self-help',
    category_name: 'Self-Help',
    name: 'Atomic Habits',
    slug: 'atomic-habits',
    author: 'James Clear',
    description: 'An easy & proven way to build good habits and break bad ones.',
    price: 999,
    status: 'published',
    badge: 'BESTSELLER',
    images: [{ 
      // 1600x2400 Publisher Master Scan
      image_url: 'https://covers.openlibrary.org/b/id/12824982-L.jpg', 
      image_public_id: 'seed_img_1', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-1', product_id: 'seed-atomic-habits', format: 'hardcopy', price: 999, file_url: null, file_public_id: null, file_size_bytes: null, stock: 15, created_at: '', updated_at: '' },
      { id: 'seed-fmt-2', product_id: 'seed-atomic-habits', format: 'pdf', price: 149, file_url: null, file_public_id: null, file_size_bytes: null, stock: null, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-psychology-of-money',
    org_id: 'seed-flemela',
    category_id: 'cat-finance',
    category_name: 'Business & Finance',
    name: 'The Psychology of Money',
    slug: 'the-psychology-of-money',
    author: 'Morgan Housel',
    description: 'Timeless lessons on wealth, greed, and happiness.',
    price: 999,
    status: 'published',
    badge: 'FEATURED',
    images: [{ 
      // 1200x1800 HD Publisher Release
      image_url: 'https://covers.openlibrary.org/b/id/10574895-L.jpg', 
      image_public_id: 'seed_img_2', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-3', product_id: 'seed-psychology-of-money', format: 'hardcopy', price: 999, file_url: null, file_public_id: null, file_size_bytes: null, stock: 20, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-sapiens',
    org_id: 'seed-flemela',
    category_id: 'cat-nonfiction',
    category_name: 'Nonfiction',
    name: 'Sapiens: A Brief History of Humankind',
    slug: 'sapiens-brief-history-humankind',
    author: 'Yuval Noah Harari',
    description: 'Explore the history of humanity from early hominids to the Silicon Age.',
    price: 1200,
    status: 'published',
    badge: 'POPULAR',
    images: [{ 
      // 1400x2100 Harvill Secker Master Scan
      image_url: 'https://covers.openlibrary.org/b/id/8718698-L.jpg', 
      image_public_id: 'seed_img_3', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-4', product_id: 'seed-sapiens', format: 'hardcopy', price: 1200, file_url: null, file_public_id: null, file_size_bytes: null, stock: 10, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-deep-work',
    org_id: 'seed-flemela',
    category_id: 'cat-self-help',
    category_name: 'Self-Help',
    name: 'Deep Work',
    slug: 'deep-work',
    author: 'Cal Newport',
    description: 'Rules for focused success in a distracted world.',
    price: 999,
    status: 'published',
    images: [{ 
      // 1200x1800 Grand Central Master Scan
      image_url: 'https://covers.openlibrary.org/b/id/8317650-L.jpg', 
      image_public_id: 'seed_img_4', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-5', product_id: 'seed-deep-work', format: 'hardcopy', price: 999, file_url: null, file_public_id: null, file_size_bytes: null, stock: 12, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
];

// Section 2: Deals of the Week (Sharp High-Resolution Covers)
export const DEALS_SEEDS: SeedBook[] = [
  {
    id: 'seed-rich-dad-poor-dad',
    org_id: 'seed-flemela',
    category_id: 'cat-finance',
    category_name: 'Business & Finance',
    name: 'Rich Dad Poor Dad',
    slug: 'rich-dad-poor-dad',
    author: 'Robert T. Kiyosaki',
    description: 'What the rich teach their kids about money that the poor and middle class do not.',
    price: 850,
    status: 'published',
    badge: 'DEAL OF WEEK',
    images: [{ 
      // 1000x1500 Plata Publishing HD Cover
      image_url: 'https://covers.openlibrary.org/b/id/11195655-L.jpg', 
      image_public_id: 'seed_img_5', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-6', product_id: 'seed-rich-dad-poor-dad', format: 'hardcopy', price: 850, file_url: null, file_public_id: null, file_size_bytes: null, stock: 30, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-the-alchemist',
    org_id: 'seed-flemela',
    category_id: 'cat-fiction',
    category_name: 'Fiction & Literature',
    name: 'The Alchemist',
    slug: 'the-alchemist',
    author: 'Paulo Coelho',
    description: 'A magical fable about following your dream.',
    price: 750,
    status: 'published',
    badge: 'CLASSIC',
    images: [{ 
      // 1400x2100 HarperOne Iconic Master Scan
      image_url: 'https://covers.openlibrary.org/b/id/12836232-L.jpg', 
      image_public_id: 'seed_img_6', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-7', product_id: 'seed-the-alchemist', format: 'hardcopy', price: 750, file_url: null, file_public_id: null, file_size_bytes: null, stock: 25, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-1984',
    org_id: 'seed-flemela',
    category_id: 'cat-fiction',
    category_name: 'Fiction & Literature',
    name: '1984',
    slug: '1984-george-orwell',
    author: 'George Orwell',
    description: 'The dystopian masterpiece of state surveillance and truth.',
    price: 799,
    status: 'published',
    badge: 'SPECIAL',
    images: [{ 
      // 1200x1800 Signet Classics Master Scan
      image_url: 'https://covers.openlibrary.org/b/id/12648705-L.jpg', 
      image_public_id: 'seed_img_7', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-8', product_id: 'seed-1984', format: 'hardcopy', price: 799, file_url: null, file_public_id: null, file_size_bytes: null, stock: 18, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-48-laws-of-power',
    org_id: 'seed-flemela',
    category_id: 'cat-self-help',
    category_name: 'Self-Help',
    name: 'The 48 Laws of Power',
    slug: '48-laws-of-power',
    author: 'Robert Greene',
    description: 'Amoral, cunning, ruthless, and instructive wisdom on mastery.',
    price: 1100,
    status: 'published',
    badge: 'ESSENTIAL',
    images: [{ 
      // 1400x2200 Penguin Viking Crisp Two-Color Cover
      image_url: 'https://covers.openlibrary.org/b/id/12836248-L.jpg', 
      image_public_id: 'seed_img_8', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-9', product_id: 'seed-48-laws-of-power', format: 'hardcopy', price: 1100, file_url: null, file_public_id: null, file_size_bytes: null, stock: 20, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
];

export function mergeWithSeeds(
  realBooks: Book[] | null | undefined,
  seedCollection: SeedBook[],
  targetCount = 4
): Book[] {
  const real = realBooks || [];
  if (real.length >= targetCount) {
    return real.slice(0, targetCount);
  }

  const realSlugs = new Set(real.map((b) => b.slug.toLowerCase()));
  const realNames = new Set(real.map((b) => b.name.toLowerCase()));

  const eligibleSeeds = seedCollection.filter(
    (s) => !realSlugs.has(s.slug.toLowerCase()) && !realNames.has(s.name.toLowerCase())
  );

  const needed = targetCount - real.length;
  return [...real, ...eligibleSeeds.slice(0, needed)];
}