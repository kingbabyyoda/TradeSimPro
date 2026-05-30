// Powered by OnSpace.AI
import { POLYGON_BASE_URL } from '@/constants/config';

export interface StockQuote {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface StockDetails {
  symbol: string;
  name: string;
  description?: string;
  marketCap?: number;
  employees?: number;
  industry?: string;
  sector?: string;
  website?: string;
  exchange?: string;
}

export interface AggBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  market: string;
}

const buildUrl = (path: string, apiKey: string, params?: Record<string, string>) => {
  const base = `${POLYGON_BASE_URL}${path}`;
  const searchParams = new URLSearchParams({ apiKey, ...(params || {}) });
  return `${base}?${searchParams.toString()}`;
};

export const fetchQuote = async (symbol: string, apiKey: string): Promise<StockQuote | null> => {
  try {
    const url = buildUrl(`/v2/last/trade/${symbol}`, apiKey);
    const prevUrl = buildUrl(`/v2/aggs/ticker/${symbol}/prev`, apiKey);

    const [tradeRes, prevRes] = await Promise.all([
      fetch(url),
      fetch(prevUrl),
    ]);

    const [tradeData, prevData] = await Promise.all([
      tradeRes.json(),
      prevRes.json(),
    ]);

    const price = tradeData?.results?.p ?? 0;
    const prevClose = prevData?.results?.[0]?.c ?? 0;
    const open = prevData?.results?.[0]?.o ?? 0;
    const high = prevData?.results?.[0]?.h ?? 0;
    const low = prevData?.results?.[0]?.l ?? 0;
    const volume = prevData?.results?.[0]?.v ?? 0;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol,
      price: price || prevClose,
      open,
      high,
      low,
      close: prevClose,
      previousClose: prevClose,
      change,
      changePercent,
      volume,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
};

export const fetchSnapshotQuote = async (symbol: string, apiKey: string): Promise<StockQuote | null> => {
  return fetchSingleQuoteFree(symbol, apiKey);
};

const fetchSingleQuoteFree = async (symbol: string, apiKey: string): Promise<StockQuote | null> => {
  try {
    const prevUrl = buildUrl(`/v2/aggs/ticker/${symbol}/prev`, apiKey, { adjusted: 'true' });
    const res = await fetch(prevUrl);
    const data = await res.json();
    const r = data?.results?.[0];
    if (!r) return null;
    const price = r.c ?? 0;
    const prevClose = r.c ?? 0;
    return {
      symbol,
      price,
      open: r.o ?? 0,
      high: r.h ?? 0,
      low: r.l ?? 0,
      close: r.c ?? 0,
      previousClose: prevClose,
      change: r.c - r.o,
      changePercent: r.o > 0 ? ((r.c - r.o) / r.o) * 100 : 0,
      volume: r.v ?? 0,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
};

export const fetchBatchQuotes = async (symbols: string[], apiKey: string): Promise<Record<string, StockQuote>> => {
  const result: Record<string, StockQuote> = {};
  // Fetch in batches of 5 to avoid rate limits
  const BATCH = 5;
  for (let i = 0; i < symbols.length; i += BATCH) {
    const batch = symbols.slice(i, i + BATCH);
    const quotes = await Promise.all(batch.map(sym => fetchSingleQuoteFree(sym, apiKey)));
    for (const q of quotes) {
      if (q) result[q.symbol] = q;
    }
    if (i + BATCH < symbols.length) await new Promise(r => setTimeout(r, 300));
  }
  return result;
};

export const fetchAggregates = async (
  symbol: string,
  apiKey: string,
  multiplier: number,
  timespan: 'minute' | 'hour' | 'day' | 'week' | 'month',
  from: string,
  to: string
): Promise<AggBar[]> => {
  try {
    const url = buildUrl(
      `/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}`,
      apiKey,
      { adjusted: 'true', sort: 'asc', limit: '300' }
    );
    const res = await fetch(url);
    const data = await res.json();
    if (!data?.results) return [];
    return data.results.map((r: any) => ({
      timestamp: r.t,
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v,
    }));
  } catch {
    return [];
  }
};

export const fetchStockDetails = async (symbol: string, apiKey: string): Promise<StockDetails | null> => {
  try {
    const url = buildUrl(`/v3/reference/tickers/${symbol}`, apiKey);
    const res = await fetch(url);
    const data = await res.json();
    const r = data?.results;
    if (!r) return null;
    return {
      symbol,
      name: r.name ?? symbol,
      description: r.description,
      marketCap: r.market_cap,
      employees: r.total_employees,
      industry: r.sic_description,
      sector: r.sector,
      website: r.homepage_url,
      exchange: r.primary_exchange,
    };
  } catch {
    return null;
  }
};

export const searchTickers = async (query: string, apiKey: string): Promise<SearchResult[]> => {
  try {
    const url = buildUrl('/v3/reference/tickers', apiKey, {
      search: query,
      active: 'true',
      market: 'stocks',
      limit: '15',
    });
    const res = await fetch(url);
    const data = await res.json();
    if (!data?.results) return [];
    return data.results.map((r: any) => ({
      symbol: r.ticker,
      name: r.name,
      type: r.type,
      market: r.market,
    }));
  } catch {
    return [];
  }
};
