// src/util/currencyConversion.js
import { types as sdkTypes } from './sdkLoader';

const { Money } = sdkTypes;

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const CACHE_KEY = 'exchangeRates';

// Fallback exchange rate (if API fails)
const FALLBACK_USD_TO_CAD = 1.35;

/**
 * Exchange Rate API Configuration
 * You can use any of these free services:
 * 1. ExchangeRate-API: https://exchangerate-api.com (free tier: 1500 requests/month)
 * 2. Fixer.io: https://fixer.io (free tier: 1000 requests/month)
 * 3. CurrencyAPI: https://currencyapi.com (free tier: 300 requests/month)
 */

// Using ExchangeRate-API (free tier, no API key required)
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

// Alternative with API key (more reliable):
// const EXCHANGE_API_URL = `https://v6.exchangerate-api.com/v6/${process.env.REACT_APP_EXCHANGE_RATE_API_KEY}/latest/USD`;

/**
 * Fetch current USD to CAD exchange rate from API
 * @returns {Promise<number>} Exchange rate (USD to CAD)
 */
const fetchExchangeRate = async () => {
  try {
    console.log('🌐 Fetching USD to CAD exchange rate...');
    
    const response = await fetch(EXCHANGE_API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const cadRate = data.rates?.CAD;
    
    if (!cadRate || typeof cadRate !== 'number') {
      throw new Error('Invalid CAD rate in API response');
    }
    
    console.log(`💱 Current USD to CAD rate: ${cadRate}`);
    return cadRate;
    
  } catch (error) {
    console.error('❌ Exchange rate API failed:', error.message);
    console.log(`🔄 Using fallback rate: ${FALLBACK_USD_TO_CAD}`);
    return FALLBACK_USD_TO_CAD;
  }
};

/**
 * Get cached exchange rate or fetch new one
 * @returns {Promise<number>} Exchange rate (USD to CAD)
 */
const getExchangeRate = async () => {
  try {
    // Check cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;
      
      if (!isExpired) {
        console.log(`📦 Using cached exchange rate: ${rate}`);
        return rate;
      }
    }
    
    // Fetch new rate
    const rate = await fetchExchangeRate();
    
    // Cache the result
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      rate,
      timestamp: Date.now()
    }));
    
    return rate;
    
  } catch (error) {
    console.error('💥 Error getting exchange rate:', error);
    return FALLBACK_USD_TO_CAD;
  }
};

/**
 * Convert USD amount to CAD amount
 * @param {number} usdAmount - Amount in USD (in subunits, e.g., cents)
 * @param {number} exchangeRate - USD to CAD exchange rate
 * @returns {number} Amount in CAD (in subunits, e.g., cents)
 */
const convertUsdToCadAmount = (usdAmount, exchangeRate) => {
  return Math.round(usdAmount * exchangeRate);
};

/**
 * Convert USD Money object to CAD Money object
 * @param {Money} usdPrice - Money object with USD currency
 * @param {number} exchangeRate - USD to CAD exchange rate
 * @returns {Money} Money object with CAD currency and converted amount
 */
const convertUsdToCadMoney = (usdPrice, exchangeRate) => {
  console.log('🔄 convertUsdToCadMoney called:', { 
    price: usdPrice, 
    exchangeRate,
    priceAmount: usdPrice?.amount,
    priceCurrency: usdPrice?.currency 
  });
  
  if (!usdPrice || usdPrice.currency !== 'USD') {
    console.log('⏭️ Skipping conversion - not USD currency or no price:', usdPrice);
    return usdPrice; // Return as-is if not USD
  }
  
  const cadAmount = convertUsdToCadAmount(usdPrice.amount, exchangeRate);
  const convertedMoney = new Money(cadAmount, 'CAD');
  
  console.log('✅ Conversion complete:', {
    originalUSD: `${(usdPrice.amount / 100).toFixed(2)}`,
    convertedCAD: `C${(cadAmount / 100).toFixed(2)}`,
    exchangeRate,
    originalAmount: usdPrice.amount,
    convertedAmount: cadAmount
  });
  
  return convertedMoney;
};

/**
 * Main function to convert price for user's preferred currency
 * @param {Money} price - Original price (USD or CAD)
 * @param {boolean} isCanadian - Whether user is Canadian
 * @returns {Promise<Money>} Converted price or original price
 */
export const convertPriceForUser = async (price, isCanadian) => {
  console.log('🏁 convertPriceForUser called:', {
    price,
    isCanadian,
    priceExists: !!price,
    priceCurrency: price?.currency,
    priceAmount: price?.amount
  });

  if (!price) {
    console.log('💰 No price provided - returning null');
    return price;
  }

  // FIXED LOGIC: Handle conversions based on user preference and price currency
  if (isCanadian) {
    // Canadian users should see everything in CAD
    if (price.currency === 'USD') {
      console.log('🇨🇦 Canadian user with USD price - converting to CAD...');
      try {
        const exchangeRate = await getExchangeRate();
        const convertedPrice = convertUsdToCadMoney(price, exchangeRate);
        console.log('💰 USD→CAD conversion result:', {
          originalPrice: `${(price.amount / 100).toFixed(2)} USD`,
          convertedPrice: `C${(convertedPrice.amount / 100).toFixed(2)} CAD`,
          exchangeRate: exchangeRate
        });
        return convertedPrice;
      } catch (error) {
        console.error('💥 Error converting USD to CAD:', error);
        console.log('🔄 Returning original USD price due to conversion error');
        return price;
      }
    } else if (price.currency === 'CAD') {
      console.log('🇨🇦 Canadian user with CAD price - no conversion needed');
      return price;
    }
  } else {
    // Non-Canadian users should see everything in USD
    if (price.currency === 'CAD') {
      console.log('🇺🇸 Non-Canadian user with CAD price - converting to USD...');
      try {
        const exchangeRate = await getExchangeRate();
        const usdAmount = Math.round(price.amount / exchangeRate);
        const convertedPrice = new Money(usdAmount, 'USD');
        console.log('💰 CAD→USD conversion result:', {
          originalPrice: `C${(price.amount / 100).toFixed(2)} CAD`,
          convertedPrice: `${(usdAmount / 100).toFixed(2)} USD`,
          exchangeRate: exchangeRate
        });
        return convertedPrice;
      } catch (error) {
        console.error('💥 Error converting CAD to USD:', error);
        console.log('🔄 Returning original CAD price due to conversion error');
        return price;
      }
    } else if (price.currency === 'USD') {
      console.log('🇺🇸 Non-Canadian user with USD price - no conversion needed');
      return price;
    }
  }

  // Fallback for unsupported currencies
  console.log('💱 Unsupported currency (' + price.currency + ') - returning original price');
  return price;
};

/**
 * Convert multiple prices in bulk (for search results)
 * @param {Array<Object>} listings - Array of listing objects with price property
 * @param {boolean} isCanadian - Whether user is Canadian
 * @returns {Promise<Array<Object>>} Listings with converted prices
 */
export const convertListingPrices = async (listings, isCanadian) => {
  console.log('📋 convertListingPrices called:', { 
    listingsCount: listings?.length || 0, 
    isCanadian,
    listingsExist: !!listings 
  });
  
  if (!isCanadian) {
    console.log('🇺🇸 User is not Canadian - returning original listings');
    return listings;
  }
  
  if (!listings || listings.length === 0) {
    console.log('📋 No listings provided - returning empty array');
    return listings;
  }
  
  console.log('🇨🇦 Canadian user with listings - checking for USD prices to convert...');
  
  try {
    // Get exchange rate once for all listings
    const exchangeRate = await getExchangeRate();
    console.log(`💱 Using exchange rate ${exchangeRate} for ${listings.length} listings`);
    
    let convertedCount = 0;
    let skippedCount = 0;
    
    const convertedListings = listings.map((listing, index) => {
      const price = listing.attributes?.price;
      console.log(`📋 Processing listing ${index + 1}/${listings.length}:`, {
        id: listing.id?.uuid,
        hasPrice: !!price,
        currency: price?.currency,
        amount: price?.amount
      });
      
      if (price && price.currency === 'USD') {
        const convertedPrice = convertUsdToCadMoney(price, exchangeRate);
        convertedCount++;
        console.log(`✅ Converted listing ${index + 1} price from ${(price.amount / 100).toFixed(2)} USD to C${(convertedPrice.amount / 100).toFixed(2)} CAD`);
        
        return {
          ...listing,
          attributes: {
            ...listing.attributes,
            price: convertedPrice
          }
        };
      } else {
        skippedCount++;
        console.log(`⏭️ Skipped listing ${index + 1} (no USD price)`);
        return listing;
      }
    });
    
    console.log('📋 Bulk conversion complete:', {
      totalListings: listings.length,
      converted: convertedCount,
      skipped: skippedCount,
      exchangeRate
    });
    
    return convertedListings;
    
  } catch (error) {
    console.error('💥 Error converting listing prices:', error);
    console.log('🔄 Returning original listings due to bulk conversion error');
    return listings; // Return original listings if conversion fails
  }
};

/**
 * Utility to clear exchange rate cache (useful for testing)
 */
export const clearExchangeRateCache = () => {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Exchange rate cache cleared');
};

/**
 * Get current cached exchange rate (for debugging)
 */
export const getCurrentExchangeRate = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { rate, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    const ageMinutes = Math.floor(age / (1000 * 60));
    
    console.log('📊 Current cached exchange rate info:', {
      rate,
      ageMinutes,
      isExpired: age > CACHE_DURATION,
      cachedAt: new Date(timestamp).toLocaleString()
    });
    
    return {
      rate,
      ageMinutes,
      isExpired: age > CACHE_DURATION
    };
  }
  console.log('📊 No cached exchange rate found');
  return null;
};

/**
 * Debug function to test currency conversion
 * Usage: testCurrencyConversion()
 */
export const testCurrencyConversion = async () => {
  console.log('🧪 Testing currency conversion system...');
  
  // Test exchange rate fetching
  try {
    const rate = await getExchangeRate();
    console.log('✅ Exchange rate test passed:', rate);
  } catch (error) {
    console.error('❌ Exchange rate test failed:', error);
  }
  
  // Test price conversion
  const testPrice = new Money(3000, 'USD'); // $30.00 USD
  
  console.log('🧪 Testing price conversion for Canadian user...');
  const convertedForCanadian = await convertPriceForUser(testPrice, true);
  console.log('Canadian result:', convertedForCanadian);
  
  console.log('🧪 Testing price conversion for US user...');
  const convertedForUS = await convertPriceForUser(testPrice, false);
  console.log('US result:', convertedForUS);
  
  console.log('🧪 Currency conversion test complete!');
};

// Make test function available globally in development
if (process.env.NODE_ENV === 'development') {
  window.testCurrencyConversion = testCurrencyConversion;
  window.clearExchangeRateCache = clearExchangeRateCache;
  window.getCurrentExchangeRate = getCurrentExchangeRate;
  console.log('🔧 Currency conversion debug functions available on window object:');
  console.log('  - testCurrencyConversion()');
  console.log('  - clearExchangeRateCache()');
  console.log('  - getCurrentExchangeRate()');
}