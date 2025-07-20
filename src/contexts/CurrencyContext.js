import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currencySettings, setCurrencySettings] = useState({
    currency_code: 'USD',
    currency_symbol: '$',
    currency_name: 'US Dollar'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencySettings();
  }, []);

  const fetchCurrencySettings = async () => {
    try {
      const response = await axios.get('/currency-settings');
      setCurrencySettings(response.data);
    } catch (error) {
      console.error('Error fetching currency settings:', error);
      // Use default settings if API fails
      setCurrencySettings({
        currency_code: 'USD',
        currency_symbol: '$',
        currency_name: 'US Dollar'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const { currency_symbol } = currencySettings;
    return `${currency_symbol}${parseFloat(amount).toFixed(2)}`;
  };

  const updateCurrencySettings = (newSettings) => {
    setCurrencySettings(newSettings);
  };

  const value = {
    currencySettings,
    formatCurrency,
    updateCurrencySettings,
    loading
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}; 