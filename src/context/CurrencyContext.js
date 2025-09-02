import React, { createContext, useContext, useEffect, useState } from 'react';
import { useConfiguration } from './configurationContext';
import { detectUserLocation } from '../util/locationDetection';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const config = useConfiguration();
  const [currency, setCurrency] = useState({
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$'
  });
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  console.log('🚀 CurrencyProvider useEffect triggered');
  
  const initializeCurrency = async () => {
    console.log('💰 Initializing currency detection...');
    
    if (typeof window === 'undefined') {
      console.log('⚠️ Server-side rendering, skipping detection');
      setIsLoading(false);
      return;
    }

    try {
      console.log('📞 Calling detectUserLocation...');
      const detected = await detectUserLocation();
      console.log('✅ Currency detection completed:', detected);
      setCurrency(detected);
    } catch (error) {
      console.error('❌ Currency detection failed:', error);
    } finally {
      console.log('🏁 Setting isLoading to false');
      setIsLoading(false);
    }
  };

  initializeCurrency();
}, []);

  const value = {
    // Current values
    activeCurrency: currency.currency,
    detectedCountry: currency.countryCode,
    stripeCountry: currency.countryCode === 'CA' ? 'CA' : 'US',
    activeSymbol: currency.currencySymbol,
    
    // Helper flags
    isCanadian: currency.countryCode === 'CA',
    isUSA: currency.countryCode === 'US',
    isLoading,
    
    // Full currency context for enhanced functions
    currencyContext: {
      activeCurrency: currency.currency,
      detectedCountry: currency.countryCode,
      stripeCountry: currency.countryCode === 'CA' ? 'CA' : 'US',
    }
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};