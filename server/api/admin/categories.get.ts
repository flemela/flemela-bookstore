// =============================================================================
// server/api/admin/categories.get.ts
// Proxy endpoint retrieving available bookstore categories.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export interface CategoryRow {
  id: string;
  name: string;
}

export default defineEventHandler(async () => {
  try {
    const categories = await sokoClient<CategoryRow[]>('/products/categories');
    return categories || [];
  } catch {
    return [
      { id: 'cat_biz', name: 'Business & Finance' },
      { id: 'cat_psych', name: 'Psychology / Self-Help' },
      { id: 'cat_self', name: 'Self-Help' },
      { id: 'cat_fict', name: 'Fiction' },
      { id: 'cat_edu', name: 'Education & Textbooks' },
      { id: 'cat_christ', name: 'Christian Books' },
    ];
  }
});