// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STARTING_BALANCE } from '@/constants/config';

export interface PortfolioPosition {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
}

export interface Trade {
  id: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  shares: number;
  price: number;
  total: number;
  timestamp: number;
  status: 'FILLED' | 'PENDING' | 'CANCELLED';
  limitPrice?: number;
}

export interface PendingOrder {
  id: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  orderType: 'LIMIT' | 'STOP_LOSS';
  shares: number;
  targetPrice: number;
  createdAt: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
}

export interface PortfolioData {
  cash: number;
  positions: PortfolioPosition[];
  trades: Trade[];
  pendingOrders: PendingOrder[];
  watchlist: WatchlistItem[];
  totalDeposited: number;
}

const STORAGE_KEY = 'trading_portfolio_v2';
const API_KEY_STORAGE = 'polygon_api_key';

export const getDefaultPortfolio = (): PortfolioData => ({
  cash: STARTING_BALANCE,
  positions: [],
  trades: [],
  pendingOrders: [],
  watchlist: [],
  totalDeposited: STARTING_BALANCE,
});

export const loadPortfolio = async (): Promise<PortfolioData> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPortfolio();
    const parsed = JSON.parse(raw);
    return { ...getDefaultPortfolio(), ...parsed };
  } catch {
    return getDefaultPortfolio();
  }
};

export const savePortfolio = async (data: PortfolioData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save portfolio', e);
  }
};

export const loadApiKey = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
};

export const saveApiKey = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(API_KEY_STORAGE, key);
  } catch (e) {
    console.error('Failed to save API key', e);
  }
};

export const resetPortfolio = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
