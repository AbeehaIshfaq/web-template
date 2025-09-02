// MODIFICATION 7: Create currency.duck.js for Redux state management
// src/ducks/currency.duck.js

// ================ Action types ================ //
export const SET_DETECTED_COUNTRY = 'app/currency/SET_DETECTED_COUNTRY';
export const SET_CURRENCY_LOADING = 'app/currency/SET_CURRENCY_LOADING';

// ================ Reducer ================ //
const initialState = {
  detectedCountry: 'US', // Default fallback
  activeCurrency: 'USD',
  isCanadian: false,
  isLoading: true,
};

export default function currencyReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_DETECTED_COUNTRY:
      return {
        ...state,
        detectedCountry: payload.countryCode,
        activeCurrency: payload.currency,
        isCanadian: payload.countryCode === 'CA',
        isLoading: false,
      };
    case SET_CURRENCY_LOADING:
      return {
        ...state,
        isLoading: payload,
      };
    default:
      return state;
  }
}

// ================ Action creators ================ //
export const setDetectedCountry = (countryData) => ({
  type: SET_DETECTED_COUNTRY,
  payload: countryData,
});

export const setCurrencyLoading = (isLoading) => ({
  type: SET_CURRENCY_LOADING,
  payload: isLoading,
});

// MODIFICATION 8: Update store configuration
// In src/store.js - Add currency reducer to the store:

import { combineReducers } from 'redux';
// ... other imports ...
import currencyReducer from './ducks/currency.duck'; // ADD THIS

const rootReducer = combineReducers({
  // ... existing reducers ...
  currency: currencyReducer, // ADD THIS LINE
});

// MODIFICATION 9: Update CurrencyContext to dispatch to Redux
// Modify src/context/CurrencyContext.js to also update Redux store:

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux'; // ADD THIS
import { useConfiguration } from './configurationContext';
import { detectUserLocation } from '../util/locationDetection';
import { setDetectedCountry, setCurrencyLoading } from '../ducks/currency.duck'; // ADD THIS

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const config = useConfiguration();
  const dispatch = useDispatch(); // ADD THIS
  
  const [currency, setCurrency] = useState({
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('CurrencyProvider useEffect triggered');
    
    const initializeCurrency = async () => {
      console.log('Initializing currency detection...');
      
      if (typeof window === 'undefined') {
        console.log('Server-side rendering, skipping detection');
        setIsLoading(false);
        dispatch(setCurrencyLoading(false)); // ADD THIS
        return;
      }

      try {
        dispatch(setCurrencyLoading(true)); // ADD THIS
        console.log('Calling detectUserLocation...');
        const detected = await detectUserLocation();
        console.log('Currency detection completed:', detected);
        
        setCurrency(detected);
        
        // UPDATE REDUX STORE WITH LOCATION_COUNTRY COMPATIBLE VALUES
        dispatch(setDetectedCountry({
          countryCode: detected.countryCode,
          currency: detected.currency,
        }));
        
      } catch (error) {
        console.error('Currency detection failed:', error);
        
        // Fallback to US
        const fallback = { countryCode: 'US', currency: 'USD' };
        dispatch(setDetectedCountry(fallback));
        
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false);
        dispatch(setCurrencyLoading(false));
      }
    };

    initializeCurrency();
  }, [dispatch]); // ADD dispatch to dependencies

  const value = {
    // Current values compatible with location_country field
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