'use server';

import { cache } from 'react';
import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const getFinnhubToken = () => process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;

type FetchOptions = {
  revalidateSeconds?: number;
};

// Minimal Finnhub `/stock/profile2` response shape we rely on.
type StockProfile2 = ProfileData & {
  ticker?: string;
  exchange?: string;
};

export const fetchJSON = async <T>(
  url: string,
  options?: FetchOptions
): Promise<T> => {
  const fetchOptions: RequestInit = options?.revalidateSeconds
    ? {
        cache: 'force-cache',
        next: { revalidate: options.revalidateSeconds },
      }
    : { cache: 'no-store' };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const getQuote = cache(async (symbol: string): Promise<QuoteData | null> => {
  try {
    const token = getFinnhubToken();
    if (!token) return null;
    const upper = symbol.trim().toUpperCase();
    if (!upper) return null;

    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(upper)}&token=${token}`;
    // Quotes should be fresh; avoid caching long
    const data = await fetchJSON<QuoteData>(url, { revalidateSeconds: 20 });
    return data ?? null;
  } catch (e) {
    console.error('Error fetching quote:', symbol, e);
    return null;
  }
});

export const getProfile = cache(async (symbol: string): Promise<ProfileData | null> => {
  try {
    const token = getFinnhubToken();
    if (!token) return null;
    const upper = symbol.trim().toUpperCase();
    if (!upper) return null;

    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(upper)}&token=${token}`;
    const data = await fetchJSON<ProfileData>(url, { revalidateSeconds: 3600 });
    return data ?? null;
  } catch (e) {
    console.error('Error fetching profile2:', symbol, e);
    return null;
  }
});

export const getBasicFinancials = cache(async (symbol: string): Promise<FinancialsData | null> => {
  try {
    const token = getFinnhubToken();
    if (!token) return null;
    const upper = symbol.trim().toUpperCase();
    if (!upper) return null;

    const url = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(upper)}&metric=all&token=${token}`;
    const data = await fetchJSON<FinancialsData>(url, { revalidateSeconds: 3600 });
    return data ?? null;
  } catch (e) {
    console.error('Error fetching financials metrics:', symbol, e);
    return null;
  }
});

export const getNews = async (
  symbols?: string[]
): Promise<MarketNewsArticle[]> => {
  try {
    const { from, to } = getDateRange(5);

    // If symbols exist, fetch company news
    if (symbols && symbols.length > 0) {
      const cleanedSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      if (cleanedSymbols.length === 0) {
        // Fallback to general news if no valid symbols
        return await fetchGeneralNews();
      }

      const articles: MarketNewsArticle[] = [];
      const maxRounds = 6;

      // Round-robin through symbols to collect news
      for (let round = 0; round < maxRounds; round++) {
        const symbolIndex = round % cleanedSymbols.length;
        const symbol = cleanedSymbols[symbolIndex];

        try {
          const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
          const news = await fetchJSON<RawNewsArticle[]>(url);

          if (news && news.length > 0) {
            // Find the first valid article not yet included
            const validArticle = news.find((article) => {
              const isValid = validateArticle(article);
              const notDuplicate = !articles.some(
                (existing) => existing.url === article.url
              );
              return isValid && notDuplicate;
            });

            if (validArticle) {
              const formatted = formatArticle(validArticle, true, symbol, round);
              articles.push(formatted);
            }
          }
        } catch (error) {
          console.error(`Error fetching news for ${symbol}:`, error);
          // Continue to next symbol on error
        }

        // Stop if we've collected 6 articles
        if (articles.length >= 6) break;
      }

      // Sort by datetime (newest first) and return
      return articles.sort((a, b) => b.datetime - a.datetime);
    }

    // No symbols provided, fetch general market news
    return await fetchGeneralNews();
  } catch (error) {
    console.error('Error in getNews:', error);
    throw new Error('Failed to fetch news');
  }
};

const fetchGeneralNews = async (): Promise<MarketNewsArticle[]> => {
  try {
    const url = `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
    const news = await fetchJSON<RawNewsArticle[]>(url);

    if (!news || news.length === 0) {
      return [];
    }

    // Deduplicate by id, url, and headline
    const seen = new Set<string>();
    const uniqueArticles: RawNewsArticle[] = [];

    for (const article of news) {
      if (!validateArticle(article)) continue;

      const key = `${article.id}-${article.url}-${article.headline}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueArticles.push(article);
      }
    }

    // Take top 6 and format them
    return uniqueArticles
      .slice(0, 6)
      .map((article, index) => formatArticle(article, false, undefined, index));
  } catch (error) {
    console.error('Error fetching general news:', error);
    return [];
  }
};


export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = getFinnhubToken();
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile: StockProfile2 | null = await fetchJSON<StockProfile2>(url, { revalidateSeconds: 3600 });
            return { sym, profile };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
          // To keep pipeline simple, attach exchange via closure map stage
          // We'll reconstruct exchange when mapping to final type
          (r as FinnhubSearchResult & { __exchange?: string }).__exchange = exchange; // internal only
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, { revalidateSeconds: 1800 });
      results = Array.isArray(data?.result) ? data.result : [];
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = (r as FinnhubSearchResult & { __exchange?: string }).__exchange;
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: false,
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});