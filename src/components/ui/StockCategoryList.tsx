import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from './accordion';
import { cn } from '../../lib/utils';

export interface StockItem {
  name: string;
  ticker: string;
  price: number;
  change: number;
}

export interface StockCategory {
  title: string;
  icon: React.ElementType;
  stocks: StockItem[];
}

export interface StockCategoryListProps {
  categories: StockCategory[];
}

export const StockCategoryList: React.FC<StockCategoryListProps> = ({ categories }) => {
  return (
    <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto">
      {categories.map((category, index) => (
        <AccordionItem value={`item-${index}`} key={category.title}>
          <AccordionTrigger className="text-lg font-medium hover:no-underline">
            <div className="flex items-center gap-3">
              <category.icon className="h-5 w-5 text-muted-foreground" />
              <span>{category.title}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4 pt-2">
              {category.stocks.map((stock) => (
                <div key={stock.ticker} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{stock.ticker}</p>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">${stock.price.toFixed(2)}</p>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        stock.change >= 0 ? 'text-green-500' : 'text-red-500'
                      )}
                    >
                      {stock.change >= 0 ? '+' : ''}
                      {stock.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
