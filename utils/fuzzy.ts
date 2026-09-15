// utils/fuzzy.ts
// =============================================================================
// Typo-Tolerant Fuzzy Search & Levenshtein Distance Matcher
// =============================================================================

import type { Book } from '~/types';

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (!q || !t) return 0;
  if (t === q) return 1.0;
  if (t.startsWith(q)) return 0.95;
  if (t.includes(q)) return 0.85;

  const queryTokens = q.split(/\s+/).filter(Boolean);
  const targetTokens = t.split(/\s+/).filter(Boolean);

  let totalScore = 0;

  for (const qToken of queryTokens) {
    let bestTokenScore = 0;

    for (const tToken of targetTokens) {
      if (tToken === qToken) {
        bestTokenScore = Math.max(bestTokenScore, 1.0);
      } else if (tToken.startsWith(qToken) || tToken.includes(qToken)) {
        bestTokenScore = Math.max(bestTokenScore, 0.8);
      } else {
        const maxLen = Math.max(qToken.length, tToken.length);
        const dist = levenshteinDistance(qToken, tToken);
        const allowedErrors = qToken.length <= 4 ? 1 : 2;

        if (dist <= allowedErrors) {
          const score = 1.0 - dist / maxLen;
          bestTokenScore = Math.max(bestTokenScore, score * 0.78);
        }
      }
    }

    totalScore += bestTokenScore;
  }

  return totalScore / queryTokens.length;
}

export interface FuzzySearchResult {
  book: Book;
  score: number;
  isFuzzyMatch: boolean;
}

export function fuzzySearchBooks(
  books: Book[],
  query: string,
  minThreshold = 0.35,
  limit = 20
): FuzzySearchResult[] {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const results: FuzzySearchResult[] = [];

  for (const book of books) {
    const titleScore = fuzzyScore(cleanQuery, book.name || '');
    const authorScore = book.author ? fuzzyScore(cleanQuery, book.author) * 0.85 : 0;
    const catScore = book.category_name ? fuzzyScore(cleanQuery, book.category_name) * 0.6 : 0;
    const skuScore = book.sku ? fuzzyScore(cleanQuery, book.sku) * 0.9 : 0;

    const maxScore = Math.max(titleScore, authorScore, catScore, skuScore);

    if (maxScore >= minThreshold) {
      const isExact = (book.name || '').toLowerCase().includes(cleanQuery.toLowerCase());
      results.push({
        book,
        score: maxScore,
        isFuzzyMatch: !isExact,
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}