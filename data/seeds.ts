// =============================================================================
// flemela/data/seeds.ts
// Permanent 100% Reliable Seed Collection (Zero Rate Limits, Zero Geo-Blocks)
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
    category_name: 'Self-Help',
    name: "Don't Make Me Think",
    slug: 'dont-make-me-think',
    author: 'Steve Krug',
    description: 'A Common Sense Approach to Web Usability.',
    price: 999,
    compare_at_price: 1450,
    status: 'published',
    badge: 'NO1_PICK',
    images: [{ 
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 
      image_public_id: 'seed_img_1', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-1', product_id: 'seed-atomic-habits', format: 'hardcopy', price: 999, compare_at_price: 1450, file_url: null, file_public_id: null, file_size_bytes: null, stock: 15, created_at: '', updated_at: '' },
      { id: 'seed-fmt-2', product_id: 'seed-atomic-habits', format: 'pdf', price: 149, compare_at_price: null, file_url: null, file_public_id: null, file_size_bytes: null, stock: null, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-each-of-us-desert',
    org_id: 'seed-flemela',
    category_id: 'cat-fiction',
    category_name: 'Fiction',
    name: 'Each of Us a Desert',
    slug: 'each-of-us-a-desert',
    author: 'Mark Oshiro',
    description: 'A fantasy about storytelling and survival in a dangerous world.',
    price: 1100,
    compare_at_price: 1600,
    status: 'published',
    badge: 'NO1_PICK',
    images: [{ 
      image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80', 
      image_public_id: 'seed_img_2', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-3', product_id: 'seed-each-of-us-desert', format: 'hardcopy', price: 1100, compare_at_price: 1600, file_url: null, file_public_id: null, file_size_bytes: null, stock: 20, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-lost-and-lassoed',
    org_id: 'seed-flemela',
    category_id: 'cat-romance',
    category_name: 'Romance',
    name: 'Lost and Lassoed',
    slug: 'lost-and-lassoed',
    author: 'Lyla Sage',
    description: 'A small-town romance full of heart, grit, and second chances.',
    price: 950,
    compare_at_price: 1400,
    status: 'published',
    badge: 'NO1_PICK',
    images: [{ 
      image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80', 
      image_public_id: 'seed_img_3', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-4', product_id: 'seed-lost-and-lassoed', format: 'hardcopy', price: 950, compare_at_price: 1400, file_url: null, file_public_id: null, file_size_bytes: null, stock: 10, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
  {
    id: 'seed-kanslo-smart',
    org_id: 'seed-flemela',
    category_id: 'cat-business',
    category_name: 'Business',
    name: 'Kanslo Smart',
    slug: 'kanslo-smart',
    author: 'David Kanslo',
    description: 'Mastering modern strategy, leverage, and cognitive execution.',
    price: 1250,
    compare_at_price: 1800,
    status: 'published',
    badge: 'NO1_PICK',
    images: [{ 
      image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80', 
      image_public_id: 'seed_img_4', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-5', product_id: 'seed-kanslo-smart', format: 'hardcopy', price: 1250, compare_at_price: 1800, file_url: null, file_public_id: null, file_size_bytes: null, stock: 12, created_at: '', updated_at: '' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    isSeed: true,
  },
];

export const DEALS_SEEDS: SeedBook[] = [
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
    compare_at_price: 1200,
    status: 'published',
    badge: 'DEAL_OF_WEEK',
    images: [{ 
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 
      image_public_id: 'seed_img_5', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-6', product_id: 'seed-rich-dad-poor-dad', format: 'hardcopy', price: 850, compare_at_price: 1200, file_url: null, file_public_id: null, file_size_bytes: null, stock: 30, created_at: '', updated_at: '' }
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
      image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80', 
      image_public_id: 'seed_img_6', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-7', product_id: 'seed-the-alchemist', format: 'hardcopy', price: 750, compare_at_price: 1100, file_url: null, file_public_id: null, file_size_bytes: null, stock: 25, created_at: '', updated_at: '' }
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
    description: 'The dystopian masterpiece of state surveillance.',
    price: 799,
    compare_at_price: 1150,
    status: 'published',
    badge: 'SPECIAL',
    images: [{ 
      image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80', 
      image_public_id: 'seed_img_7', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-8', product_id: 'seed-1984', format: 'hardcopy', price: 799, compare_at_price: 1150, file_url: null, file_public_id: null, file_size_bytes: null, stock: 18, created_at: '', updated_at: '' }
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
    description: 'Amoral, cunning, and instructive wisdom on mastery.',
    price: 1100,
    compare_at_price: 1650,
    status: 'published',
    badge: 'ESSENTIAL',
    images: [{ 
      image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80', 
      image_public_id: 'seed_img_8', 
      sort_order: 0 
    }],
    formats: [
      { id: 'seed-fmt-9', product_id: 'seed-48-laws-of-power', format: 'hardcopy', price: 1100, compare_at_price: 1650, file_url: null, file_public_id: null, file_size_bytes: null, stock: 20, created_at: '', updated_at: '' }
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
  const realWithCovers = (realBooks || []).filter((b) => {
    const firstImg: unknown = b.images?.[0];
    if (typeof firstImg === 'string' && firstImg.length > 5) return true;
    if (
      firstImg &&
      typeof firstImg === 'object' &&
      'image_url' in firstImg &&
      Boolean((firstImg as { image_url?: string }).image_url)
    ) {
      return true;
    }
    if ((b as any).cover_image_url) return true;
    return false;
  });

  if (realWithCovers.length >= targetCount) {
    return realWithCovers.slice(0, targetCount);
  }

  const realSlugs = new Set(realWithCovers.map((b) => b.slug.toLowerCase()));
  const realNames = new Set(realWithCovers.map((b) => b.name.toLowerCase()));

  const eligibleSeeds = seedCollection.filter(
    (s) => !realSlugs.has(s.slug.toLowerCase()) && !realNames.has(s.name.toLowerCase())
  );

  const needed = targetCount - realWithCovers.length;
  return [...realWithCovers, ...eligibleSeeds.slice(0, needed)];
}