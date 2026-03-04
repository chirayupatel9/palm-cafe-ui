import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export interface CurrencySettings {
  currency_code: string;
  currency_symbol: string;
  currency_name: string;
}

export interface CurrencyContextValue {
  currencySettings: CurrencySettings;
  formatCurrency: (amount: number | string | null | undefined) => string;
  updateCurrencySettings: (newSettings: CurrencySettings) => void;
  fetchCurrencySettings: () => Promise<void>;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

const defaultCurrencySettings: CurrencySettings = {
  currency_code: 'INR',
  currency_symbol: '₹',
  currency_name: 'Indian Rupee'
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>(defaultCurrencySettings);
  const [loading, setLoading] = useState(true);

  const fetchCurrencySettings = async () => {
    try {
      const response = await axios.get('/currency-settings');
      setCurrencySettings(response.data as CurrencySettings);
    } catch (error) {
      console.error('Error fetching currency settings:', error);
      setCurrencySettings(defaultCurrencySettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencySettings();
  }, []);

  const formatCurrency = (amount: number | string | null | undefined): string => {
    const { currency_symbol } = currencySettings;
    if (amount === null || amount === undefined || amount === '' || (typeof amount === 'number' && isNaN(amount))) {
      return `${currency_symbol}0.00`;
    }
    const parsedAmount = parseFloat(String(amount));
    if (isNaN(parsedAmount)) {
      return `${currency_symbol}0.00`;
    }
    return `${currency_symbol}${parsedAmount.toFixed(2)}`;
  };

  const updateCurrencySettings = (newSettings: CurrencySettings) => {
    setCurrencySettings(newSettings);
  };

  const value: CurrencyContextValue = {
    currencySettings,
    formatCurrency,
    updateCurrencySettings,
    fetchCurrencySettings,
    loading
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};
