// Powered by OnSpace.AI
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSnapshotQuote, StockQuote } from '@/services/polygon';
import { usePortfolio } from './usePortfolio';

export function useStockQuote(symbol: string, autoRefresh = false) {
  const { apiKey } = usePortfolio();
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!apiKey || !symbol) return;
    setIsLoading(true);
    setError(null);
    try {
      const q = await fetchSnapshotQuote(symbol, apiKey);
      if (q) setQuote(q);
      else setError('No data available');
    } catch {
      setError('Failed to fetch quote');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, symbol]);

  useEffect(() => {
    load();
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load, autoRefresh]);

  return { quote, isLoading, error, refresh: load };
}
