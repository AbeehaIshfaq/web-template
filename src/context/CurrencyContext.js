// Enhanced CurrencyContext.js - Add manual currency selection while preserving all existing logic

import React, { createContext, useContext, useEffect, useState } from 'react';
import { detectUserLocation } from '../util/locationDetection';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [isCanadian, setIsCanadian] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(null); // NEW: Manual selection
  
  useEffect(() => {
    const initializeCurrencyDetection = async () => {
      console.log('🔄 CurrencyProvider useEffect triggered');
      console.log('🏁 Initializing currency detection...');
      
      try {
        console.log('🔍 Calling detectUserLocation...');
        const locationData = await detectUserLocation();
        console.log('✅ Currency detection completed:', locationData);
        
        setIsCanadian(locationData.isCanadian);
        console.log('📍 Setting isCanadian to', locationData.isCanadian);
      } catch (error) {
        console.error('💥 Error in currency detection:', error);
        // Default to non-Canadian if detection fails
        setIsCanadian(false);
        console.log('🔄 Defaulting to non-Canadian due to error');
      } finally {
        console.log('🏁 Setting isLoading to false');
        setIsLoading(false);
      }
    };

    initializeCurrencyDetection();
  }, []);

  // NEW: Function to get effective currency preference
  const getEffectiveCurrencyPreference = () => {
    // If user manually selected a currency, use that
    if (selectedCurrency) {
      return selectedCurrency === 'CAD';
    }
    // Otherwise fall back to automatic detection
    return isCanadian;
  };

  // NEW: Function to set manual currency selection
  const setManualCurrency = (currency) => {
    console.log('💱 Manual currency selection:', currency);
    setSelectedCurrency(currency);
  };

  // NEW: Function to clear manual selection (revert to auto)
  const clearManualCurrency = () => {
    console.log('🔄 Clearing manual currency selection, reverting to auto');
    setSelectedCurrency(null);
  };

  // NEW: Function to get current currency display info
  const getCurrencyInfo = () => {
    const effectiveIsCanadian = getEffectiveCurrencyPreference();
    const isManual = selectedCurrency !== null;
    
    return {
      isCanadian: effectiveIsCanadian,
      currency: effectiveIsCanadian ? 'CAD' : 'USD',
      symbol: effectiveIsCanadian ? 'C$' : '$',
      isManualSelection: isManual,
      autoDetectedCurrency: isCanadian ? 'CAD' : 'USD',
      selectedCurrency: selectedCurrency
    };
  };

  const value = {
    // Existing values (preserved)
    isCanadian: getEffectiveCurrencyPreference(), // Updated to use effective preference
    isLoading,
    
    // New values (additional)
    originalIsCanadian: isCanadian, // Preserve original auto-detected value
    selectedCurrency,
    setManualCurrency,
    clearManualCurrency,
    getCurrencyInfo,
    getEffectiveCurrencyPreference, // Export the function for components to use
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