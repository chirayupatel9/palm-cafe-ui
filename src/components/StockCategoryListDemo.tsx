import React from 'react';
import { StockCategoryList } from './ui/StockCategoryList';
import {
  Cpu,
  HeartPulse,
  Landmark,
  ShoppingBasket,
  Flame
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StockItem {
  name: string;
  ticker: string;
  price: number;
  change: number;
}

interface StockCategory {
  title: string;
  icon: LucideIcon;
  stocks: StockItem[];
}

const stockData: StockCategory[] = [
  {
    title: 'Technology',
    icon: Cpu,
    stocks: [
      { name: 'Apple Inc.', ticker: 'AAPL', price: 172.25, change: 1.12 },
      { name: 'Microsoft Corp.', ticker: 'MSFT', price: 340.54, change: -0.45 },
      { name: 'NVIDIA Corp.', ticker: 'NVDA', price: 470.61, change: 2.33 }
    ]
  },
  {
    title: 'Healthcare',
    icon: HeartPulse,
    stocks: [
      { name: 'Johnson & Johnson', ticker: 'JNJ', price: 165.78, change: -0.89 },
      { name: 'Pfizer Inc.', ticker: 'PFE', price: 35.12, change: 0.21 }
    ]
  },
  {
    title: 'Financials',
    icon: Landmark,
    stocks: [
      { name: 'JPMorgan Chase & Co.', ticker: 'JPM', price: 150.44, change: 0.55 },
      { name: 'Bank of America', ticker: 'BAC', price: 29.88, change: -1.02 },
      { name: 'Visa Inc.', ticker: 'V', price: 245.91, change: 0.15 }
    ]
  },
  {
    title: 'Consumer Staples',
    icon: ShoppingBasket,
    stocks: [
      { name: 'Procter & Gamble', ticker: 'PG', price: 155.6, change: 0.05 },
      { name: 'Coca-Cola Co.', ticker: 'KO', price: 60.1, change: -0.3 }
    ]
  },
  {
    title: 'Energy',
    icon: Flame,
    stocks: [
      { name: 'Exxon Mobil Corp.', ticker: 'XOM', price: 112.76, change: 1.78 },
      { name: 'Chevron Corp.', ticker: 'CVX', price: 164.21, change: 1.51 }
    ]
  }
];

const StockCategoryListDemo: React.FC = () => {
  return (
    <div className="p-4 md:p-8 bg-background">
      <StockCategoryList categories={stockData} />
    </div>
  );
};

export default StockCategoryListDemo;
