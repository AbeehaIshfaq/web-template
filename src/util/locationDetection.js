// src/util/locationDetection.js
import { userLocation } from './maps';

export const detectUserLocation = async () => {
  console.log('detectUserLocation function called');
  
  const cacheKey = 'detectedUserLocation';
  const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  try {
    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    console.log('Cached data:', cached);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheExpiry) {
        console.log('Using cached data:', data);
        return data;
      }
    }

    // Get Mapbox token from environment variable
    const mapboxToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    console.log('Mapbox token available:', !!mapboxToken);
    console.log('Protocol:', window.location.protocol);
    console.log('Has userLocation function:', typeof userLocation === 'function');
    
    // Try GPS first (works on both HTTP and HTTPS for localhost)
    if (mapboxToken && typeof userLocation === 'function') {
      try {
        console.log('Attempting GPS location...');
        const latlng = await userLocation();
        console.log('GPS coordinates:', latlng);
        
        if (latlng && latlng.lat && latlng.lng) {
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${latlng.lng},${latlng.lat}.json?types=country&access_token=${mapboxToken}`;
          console.log('Geocoding with Mapbox...');
          
          const response = await fetch(geocodeUrl);
          console.log('Geocoding response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Geocoding data:', data);
            
            const countryCode = data.features?.[0]?.properties?.short_code?.toUpperCase();
            console.log('Detected country code:', countryCode);
            
            if (countryCode) {
              const result = {
                countryCode,
                currency: countryCode === 'CA' ? 'CAD' : 'USD',
                currencySymbol: countryCode === 'CA' ? 'C$' : '$',
                method: 'gps'
              };
              console.log('GPS detection SUCCESS:', result);
              localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }));
              return result;
            }
          }
        }
      } catch (gpsError) {
        console.log('GPS failed:', gpsError.message);
      }
    }

    // Fallback: Try simple IP detection with a CORS-free service
    console.log('Trying IP detection fallback...');
    
    try {
      // This service should work without CORS issues
      const response = await fetch('https://api.country.is/');
      console.log('IP service response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('IP service data:', data);
        
        const result = {
          countryCode: data.country || 'US',
          currency: data.country === 'CA' ? 'CAD' : 'USD',
          currencySymbol: data.country === 'CA' ? 'C$' : '$',
          method: 'ip'
        };
        
        console.log('IP detection SUCCESS:', result);
        localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }));
        return result;
      }
    } catch (ipError) {
      console.log('IP detection failed:', ipError.message);
    }

  } catch (error) {
    console.log('All detection methods failed:', error.message);
  }
  
  // Ultimate fallback
  const fallbackResult = {
    countryCode: 'US',
    currency: 'USD', 
    currencySymbol: '$',
    method: 'fallback'
  };
  console.log('Using fallback result:', fallbackResult);
  localStorage.setItem(cacheKey, JSON.stringify({ data: fallbackResult, timestamp: Date.now() }));
  return fallbackResult;
};