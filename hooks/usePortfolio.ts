// Powered by OnSpace.AI
import { useContext } from 'react';
import { PortfolioContext, PortfolioContextType } from '@/contexts/PortfolioContext';

export function usePortfolio(): PortfolioContextType {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within PortfolioProvider');
  return context;
}
