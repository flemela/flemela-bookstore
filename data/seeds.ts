// data/seeds.ts
// =============================================================================
// Permanent Seed Collection with Exact Title-Matched High-Res Covers
// =============================================================================

import type { Book } from '~/types';

export interface SeedBook extends Book {
  isSeed: true;
}

export const MONTHLY_TOP_SEEDS: SeedBook[] = [
  {
    id: 'seed-atomic-habits',
    org_id: 'seed-flemela',
    category_id: 'cat-self-help',
    category_name: 'Psychology & Self-Help',
    name: 'Atomic Habits',
    slug: 'atomic-habits',
    author: 'James Clear',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones.',
    price: 1250,
    compare_at_price: 1800,
    status: 'published',
    badge: 'NO1_PICK',
    images: [{ 
      image_url: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg', 
      image_public_id: 'seed_atomic_habits', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-1', product_id: 'seed-atomic-habits', format: 'hardcopy', price: 1250, compare_at_price: 1800, file_url: null, file_public_id: null, file_size_bytes: null, stock: 25, created_at: '', updated_at: '' },
      { id: 'seed-fmt-2', product_id: 'seed-atomic-habits', format: 'pdf', price: 199, compare_at_price: null, file_url: null, file_public_id: null, file_size_bytes: null, stock: null, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-dont-make-me-think',
    org_id: 'seed-flemela',
    category_id: 'cat-business',
    category_name: 'Business & Finance',
    name: "Don't Make Me Think",
    slug: 'dont-make-me-think',
    author: 'Steve Krug',
    description: 'A Common Sense Approach to Web Usability.',
    price: 1100,
    compare_at_price: 1550,
    status: 'published',
    badge: 'NO1_PICK',
    images: [{ 
      image_url: 'https://covers.openlibrary.org/b/isbn/9780321965516-L.jpg', 
      image_public_id: 'seed_dont_make_me_think', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-3', product_id: 'seed-dont-make-me-think', format: 'hardcopy', price: 1100, compare_at_price: 1550, file_url: null, file_public_id: null, file_size_bytes: null, stock: 18, created_at: '', updated_at: '' },
      { id: 'seed-fmt-4', product_id: 'seed-dont-make-me-think', format: 'pdf', price: 149, compare_at_price: null, file_url: null, file_public_id: null, file_size_bytes: null, stock: null, created_at: '', updated_at: '' }
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
    slug: 'psychology-of-money',
    author: 'Morgan Housel',
    description: 'Timeless lessons on wealth, greed, and happiness.',
    price: 1150,
    compare_at_price: 1650,
    status: 'published',
    badge: 'NO1_PICK',
    images: [{ 
      image_url: 'https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg', 
      image_public_id: 'seed_psych_money', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-5', product_id: 'seed-psychology-of-money', format: 'hardcopy', price: 1150, compare_at_price: 1650, file_url: null, file_public_id: null, file_size_bytes: null, stock: 20, created_at: '', updated_at: '' },
      { id: 'seed-fmt-6', product_id: 'seed-psychology-of-money', format: 'epub', price: 149, compare_at_price: null, file_url: null, file_public_id: null, file_size_bytes: null, stock: null, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-deep-work',
    org_id: 'seed-flemela',
    category_id: 'cat-self-help',
    category_name: 'Psychology & Self-Help',
    name: 'Deep Work',
    slug: 'deep-work',
    author: 'Cal Newport',
    description: 'Rules for Focused Success in a Distracted World.',
    price: 1100,
    compare_at_price: 1500,
    status: 'published',
    badge: 'NO1_PICK',
    images: [{ 
      image_url: 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg', 
      image_public_id: 'seed_deep_work', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-7', product_id: 'seed-deep-work', format: 'hardcopy', price: 1100, compare_at_price: 1500, file_url: null, file_public_id: null, file_size_bytes: null, stock: 14, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
];

export const DEALS_SEEDS: SeedBook[] = [
  {
    id: 'seed-48-laws-of-power',
    org_id: 'seed-flemela',
    category_id: 'cat-self-help',
    category_name: 'Psychology & Self-Help',
    name: 'The 48 Laws of Power',
    slug: '48-laws-of-power',
    author: 'Robert Greene',
    description: 'Amoral, cunning, and instructive wisdom on mastery.',
    price: 1200,
    compare_at_price: 1800,
    status: 'published',
    badge: 'DEAL_OF_WEEK',
    images: [{ 
      image_url: 'https://covers.openlibrary.org/b/isbn/9780140280197-L.jpg', 
      image_public_id: 'seed_48_laws', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-8', product_id: 'seed-48-laws-of-power', format: 'hardcopy', price: 1200, compare_at_price: 1800, file_url: null, file_public_id: null, file_size_bytes: null, stock: 30, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-rich-dad-poor-dad',
    org_id: 'seed-flemela',
    category_id: 'cat-finance',
    category_name: 'Business & Finance',
    name: 'Rich Dad Poor Dad',
    slug: 'rich-dad-poor-dad',
    author: 'Robert T. Kiyosaki',
    description: 'What the rich teach their kids about money.',
    price: 850,
    compare_at_price: 1300,
    status: 'published',
    badge: 'DEAL_OF_WEEK',
    images: [{ 
      image_url: 'https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg', 
      image_public_id: 'seed_rich_dad', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-9', product_id: 'seed-rich-dad-poor-dad', format: 'hardcopy', price: 850, compare_at_price: 1300, file_url: null, file_public_id: null, file_size_bytes: null, stock: 25, created_at: '', updated_at: '' }
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
    compare_at_price: 1100,
    status: 'published',
    badge: 'CLASSIC',
    images: [{ 
      image_url: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg', 
      image_public_id: 'seed_the_alchemist', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-10', product_id: 'seed-the-alchemist', format: 'hardcopy', price: 750, compare_at_price: 1100, file_url: null, file_public_id: null, file_size_bytes: null, stock: 20, created_at: '', updated_at: '' }
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
    description: 'The dystopian masterpiece of surveillance and truth.',
    price: 799,
    compare_at_price: 1200,
    status: 'published',
    badge: 'SPECIAL',
    images: [{ 
      image_url: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg', 
      image_public_id: 'seed_1984', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-11', product_id: 'seed-1984', format: 'hardcopy', price: 799, compare_at_price: 1200, file_url: null, file_public_id: null, file_size_bytes: null, stock: 22, created_at: '', updated_at: '' }
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

  // If we have enough real books with this specific badge, return all of them
  if (real.length >= targetCount) {
    return real;
  }

  const realSlugs = new Set(real.map((b) => b.slug.toLowerCase()));
  const realNames = new Set(real.map((b) => b.name.toLowerCase()));

  // Avoid duplicate cards if a real book shares title/slug with a seed
  const eligibleSeeds = seedCollection.filter(
    (s) => !realSlugs.has(s.slug.toLowerCase()) && !realNames.has(s.name.toLowerCase())
  );

  const needed = targetCount - real.length;
  return [...real, ...eligibleSeeds.slice(0, needed)];
}