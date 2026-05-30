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
  try {
    const url = buildUrl(`/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}`, apiKey);
    const res = await fetch(url);
    const data = await res.json();
    const ticker = data?.ticker;
    if (!ticker) return null;

    const day = ticker.day || {};
    const prevDay = ticker.prevDay || {};
    const lastTrade = ticker.lastTrade || {};
    const todayChange = ticker.todaysChange ?? 0;
    const todayChangePct = ticker.todaysChangePerc ?? 0;

    const price = lastTrade.p ?? day.c ?? prevDay.c ?? 0;

    return {
      symbol,
      price,
      open: day.o ?? prevDay.o ?? 0,
      high: day.h ?? prevDay.h ?? 0,
      low: day.l ?? prevDay.l ?? 0,
      close: day.c ?? prevDay.c ?? 0,
      previousClose: prevDay.c ?? 0,
      change: todayChange,
      changePercent: todayChangePct,
      volume: day.v ?? prevDay.v ?? 0,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
};

export const fetchBatchQuotes = async (symbols: string[], apiKey: string): Promise<Record<string, StockQuote>> => {
  const result: Record<string, StockQuote> = {};
  try {
    const tickers = symbols.join(',');
    const url = buildUrl(`/v2/snapshot/locale/us/markets/stocks/tickers`, apiKey, { tickers });
    const res = await fetch(url);
    const data = await res.json();

    if (data?.tickers) {
      for (const ticker of data.tickers) {
        const sym = ticker.ticker;
        const day = ticker.day || {};
        const prevDay = ticker.prevDay || {};
        const lastTrade = ticker.lastTrade || {};
        const price = lastTrade.p ?? day.c ?? prevDay.c ?? 0;
        result[sym] = {
          symbol: sym,
          price,
          open: day.o ?? 0,
          high: day.h ?? 0,
          low: day.l ?? 0,
          close: day.c ?? 0,
          previousClose: prevDay.c ?? 0,
          change: ticker.todaysChange ?? 0,
          changePercent: ticker.todaysChangePerc ?? 0,
          volume: day.v ?? 0,
          timestamp: Date.now(),
        };
      }
    }
  } catch {}
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
