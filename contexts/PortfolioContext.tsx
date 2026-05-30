// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  PortfolioData,
  PortfolioPosition,
  Trade,
  PendingOrder,
  WatchlistItem,
  loadPortfolio,
  savePortfolio,
  loadApiKey,
  saveApiKey,
  getDefaultPortfolio,
  resetPortfolio,
} from '@/services/storage';

export interface PortfolioContextType {
  portfolio: PortfolioData;
  apiKey: string | null;
  isLoading: boolean;
  setApiKey: (key: string) => Promise<void>;
  executeTrade: (params: ExecuteTradeParams) => { success: boolean; message: string };
  placePendingOrder: (params: PlacePendingOrderParams) => { success: boolean; message: string };
  cancelOrder: (orderId: string) => void;
  addToWatchlist: (item: { symbol: string; name: string }) => void;
  removeFromWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  updatePositionPrice: (symbol: string, price: number) => void;
  updateBatchPrices: (prices: Record<string, number>) => void;
  resetAccount: () => Promise<void>;
  checkPendingOrders: (currentPrices: Record<string, number>) => void;
  totalPortfolioValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

export interface ExecuteTradeParams {
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  shares: number;
  price: number;
  limitPrice?: number;
}

export interface PlacePendingOrderParams {
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  orderType: 'LIMIT' | 'STOP_LOSS';
  shares: number;
  targetPrice: number;
}

export const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioData>(getDefaultPortfolio());
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [saved, key] = await Promise.all([loadPortfolio(), loadApiKey()]);
      setPortfolio(saved);
      setApiKeyState(key);
      setIsLoading(false);
    };
    init();
  }, []);

  const persist = useCallback(async (data: PortfolioData) => {
    setPortfolio(data);
    await savePortfolio(data);
  }, []);

  const setApiKey = useCallback(async (key: string) => {
    setApiKeyState(key);
    await saveApiKey(key);
  }, []);

  const executeTrade = useCallback(
    (params: ExecuteTradeParams): { success: boolean; message: string } => {
      const { symbol, name, type, orderType, shares, price } = params;
      const total = shares * price;
      const newPortfolio = { ...portfolio };
      newPortfolio.positions = [...portfolio.positions];
      newPortfolio.trades = [...portfolio.trades];

      if (type === 'BUY') {
        if (total > portfolio.cash) {
          return { success: false, message: `Insufficient funds. Need $${total.toFixed(2)}, available $${portfolio.cash.toFixed(2)}` };
        }
        newPortfolio.cash = portfolio.cash - total;
        const existingIdx = newPortfolio.positions.findIndex(p => p.symbol === symbol);
        if (existingIdx >= 0) {
          const pos = { ...newPortfolio.positions[existingIdx] };
          const totalShares = pos.shares + shares;
          pos.avgCost = (pos.shares * pos.avgCost + total) / totalShares;
          pos.shares = totalShares;
          pos.currentPrice = price;
          newPortfolio.positions[existingIdx] = pos;
        } else {
          newPortfolio.positions.push({ symbol, name, shares, avgCost: price, currentPrice: price });
        }
      } else {
        const posIdx = newPortfolio.positions.findIndex(p => p.symbol === symbol);
        if (posIdx < 0) return { success: false, message: `No position in ${symbol}` };
        const pos = newPortfolio.positions[posIdx];
        if (pos.shares < shares) return { success: false, message: `Only ${pos.shares} shares available` };
        newPortfolio.cash = portfolio.cash + total;
        if (pos.shares === shares) {
          newPortfolio.positions.splice(posIdx, 1);
        } else {
          newPortfolio.positions[posIdx] = { ...pos, shares: pos.shares - shares };
        }
      }

      const trade: Trade = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        symbol,
        name,
        type,
        orderType,
        shares,
        price,
        total,
        timestamp: Date.now(),
        status: 'FILLED',
      };
      newPortfolio.trades = [trade, ...newPortfolio.trades];

      persist(newPortfolio);
      return { success: true, message: `${type} order filled: ${shares} × ${symbol} @ $${price.toFixed(2)}` };
    },
    [portfolio, persist]
  );

  const placePendingOrder = useCallback(
    (params: PlacePendingOrderParams): { success: boolean; message: string } => {
      const { symbol, name, type, orderType, shares, targetPrice } = params;
      const order: PendingOrder = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        symbol,
        name,
        type,
        orderType,
        shares,
        targetPrice,
        createdAt: Date.now(),
      };
      const newPortfolio = { ...portfolio, pendingOrders: [order, ...portfolio.pendingOrders] };
      persist(newPortfolio);
      return { success: true, message: `${orderType} order placed for ${shares} × ${symbol} @ $${targetPrice.toFixed(2)}` };
    },
    [portfolio, persist]
  );

  const cancelOrder = useCallback(
    (orderId: string) => {
      const newPortfolio = {
        ...portfolio,
        pendingOrders: portfolio.pendingOrders.filter(o => o.id !== orderId),
        trades: [
          {
            id: `${Date.now()}-cancelled`,
            symbol: portfolio.pendingOrders.find(o => o.id === orderId)?.symbol ?? '',
            name: portfolio.pendingOrders.find(o => o.id === orderId)?.name ?? '',
            type: portfolio.pendingOrders.find(o => o.id === orderId)?.type ?? 'BUY',
            orderType: portfolio.pendingOrders.find(o => o.id === orderId)?.orderType ?? 'LIMIT',
            shares: portfolio.pendingOrders.find(o => o.id === orderId)?.shares ?? 0,
            price: portfolio.pendingOrders.find(o => o.id === orderId)?.targetPrice ?? 0,
            total: 0,
            timestamp: Date.now(),
            status: 'CANCELLED' as const,
          },
          ...portfolio.trades,
        ],
      };
      persist(newPortfolio);
    },
    [portfolio, persist]
  );

  const addToWatchlist = useCallback(
    (item: { symbol: string; name: string }) => {
      if (portfolio.watchlist.some(w => w.symbol === item.symbol)) return;
      const newPortfolio = {
        ...portfolio,
        watchlist: [{ ...item, addedAt: Date.now() }, ...portfolio.watchlist],
      };
      persist(newPortfolio);
    },
    [portfolio, persist]
  );

  const removeFromWatchlist = useCallback(
    (symbol: string) => {
      const newPortfolio = {
        ...portfolio,
        watchlist: portfolio.watchlist.filter(w => w.symbol !== symbol),
      };
      persist(newPortfolio);
    },
    [portfolio, persist]
  );

  const isInWatchlist = useCallback(
    (symbol: string) => portfolio.watchlist.some(w => w.symbol === symbol),
    [portfolio]
  );

  const updatePositionPrice = useCallback(
    (symbol: string, price: number) => {
      const idx = portfolio.positions.findIndex(p => p.symbol === symbol);
      if (idx < 0 || portfolio.positions[idx].currentPrice === price) return;
      const newPositions = [...portfolio.positions];
      newPositions[idx] = { ...newPositions[idx], currentPrice: price };
      setPortfolio(prev => ({ ...prev, positions: newPositions }));
    },
    [portfolio]
  );

  const updateBatchPrices = useCallback(
    (prices: Record<string, number>) => {
      setPortfolio(prev => {
        const newPositions = prev.positions.map(p => ({
          ...p,
          currentPrice: prices[p.symbol] ?? p.currentPrice,
        }));
        return { ...prev, positions: newPositions };
      });
    },
    []
  );

  const checkPendingOrders = useCallback(
    (currentPrices: Record<string, number>) => {
      const toFill: PendingOrder[] = [];
      const remaining: PendingOrder[] = [];
      for (const order of portfolio.pendingOrders) {
        const price = currentPrices[order.symbol];
        if (!price) { remaining.push(order); continue; }
        let shouldFill = false;
        if (order.orderType === 'LIMIT') {
          shouldFill = order.type === 'BUY' ? price <= order.targetPrice : price >= order.targetPrice;
        } else if (order.orderType === 'STOP_LOSS') {
          shouldFill = price <= order.targetPrice;
        }
        if (shouldFill) toFill.push(order);
        else remaining.push(order);
      }
      if (toFill.length === 0) return;
      let newPortfolio = { ...portfolio, pendingOrders: remaining };
      for (const order of toFill) {
        const price = currentPrices[order.symbol] ?? order.targetPrice;
        const total = order.shares * price;
        const newTrades = [...newPortfolio.trades];
        newTrades.unshift({
          id: `${Date.now()}-auto`,
          symbol: order.symbol,
          name: order.name,
          type: order.type,
          orderType: order.orderType,
          shares: order.shares,
          price,
          total,
          timestamp: Date.now(),
          status: 'FILLED',
        });
        newPortfolio.trades = newTrades;
        if (order.type === 'BUY') {
          newPortfolio.cash -= total;
          const posIdx = newPortfolio.positions.findIndex(p => p.symbol === order.symbol);
          if (posIdx >= 0) {
            const pos = { ...newPortfolio.positions[posIdx] };
            const totalShares = pos.shares + order.shares;
            pos.avgCost = (pos.shares * pos.avgCost + total) / totalShares;
            pos.shares = totalShares;
            pos.currentPrice = price;
            newPortfolio.positions = [...newPortfolio.positions];
            newPortfolio.positions[posIdx] = pos;
          } else {
            newPortfolio.positions = [...newPortfolio.positions, { symbol: order.symbol, name: order.name, shares: order.shares, avgCost: price, currentPrice: price }];
          }
        } else {
          newPortfolio.cash += total;
          const posIdx = newPortfolio.positions.findIndex(p => p.symbol === order.symbol);
          if (posIdx >= 0) {
            const pos = newPortfolio.positions[posIdx];
            newPortfolio.positions = [...newPortfolio.positions];
            if (pos.shares <= order.shares) {
              newPortfolio.positions.splice(posIdx, 1);
            } else {
              newPortfolio.positions[posIdx] = { ...pos, shares: pos.shares - order.shares };
            }
          }
        }
      }
      persist(newPortfolio);
    },
    [portfolio, persist]
  );

  const resetAccount = useCallback(async () => {
    await resetPortfolio();
    setPortfolio(getDefaultPortfolio());
  }, []);

  const positionsValue = portfolio.positions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
  const totalPortfolioValue = portfolio.cash + positionsValue;
  const totalGainLoss = totalPortfolioValue - portfolio.totalDeposited;
  const totalGainLossPercent = portfolio.totalDeposited > 0 ? (totalGainLoss / portfolio.totalDeposited) * 100 : 0;

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        apiKey,
        isLoading,
        setApiKey,
        executeTrade,
        placePendingOrder,
        cancelOrder,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        updatePositionPrice,
        updateBatchPrices,
        resetAccount,
        checkPendingOrders,
        totalPortfolioValue,
        totalGainLoss,
        totalGainLossPercent,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}
