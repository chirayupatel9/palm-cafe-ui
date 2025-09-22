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
    currency_code: 'INR',
    currency_symbol: '₹',
    currency_name: 'Indian Rupee'
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
        currency_code: 'INR',
        currency_symbol: '₹',
        currency_name: 'Indian Rupee'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const { currency_symbol } = currencySettings;
    
    // Handle null, undefined, empty string, or non-numeric values
    if (amount === null || amount === undefined || amount === '' || isNaN(amount)) {
      return `${currency_symbol}0.00`;
    }
    
    // Parse the amount to ensure it's a number
    const parsedAmount = parseFloat(amount);
    
    // Handle NaN after parsing
    if (isNaN(parsedAmount)) {
      return `${currency_symbol}0.00`;
    }
    
    // Format with exactly 2 decimal places
    return `${currency_symbol}${parsedAmount.toFixed(2)}`;
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