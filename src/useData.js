// src/useData.js
import { useState, useEffect, useCallback } from 'react';

export const useData = () => {
  const [data, setData] = useState({
    sales_po: [],
    fabric: [],
    insert_pattern: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const handleDataLoad = useCallback((fetched) => {
    try {
      const fabricData = fetched.fabric || fetched.fabric_po || [];
      
      setData({
        sales_po: fetched.sales_po || [],
        fabric: fabricData,
        insert_pattern: fetched.insert_pattern || []
      });
      
      console.log('Data loaded successfully:', {
        sales: fetched.sales_po?.length || 0,
        fabric: fabricData.length,
        developments: fetched.insert_pattern?.length || 0
      });
    } catch (e) {
      console.error('Data parsing error:', e);
      setError("Error parsing data from server");
    } finally {
      setLoading(false);
      setScriptLoaded(true);
    }
  }, []);

  const handleLoadError = useCallback(() => {
    console.error('Script loading failed');
    setError("Failed to load data. Please check your connection.");
    setLoading(false);
    setScriptLoaded(true);
  }, []);

  useEffect(() => {
    // Only load data once
    if (scriptLoaded) return;

    setLoading(true);
    setError(null);

    // Cleanup any existing callback
    if (window.jsonpCallback) {
      console.log('Cleaning up existing callback');
      delete window.jsonpCallback;
    }

    window.jsonpCallback = handleDataLoad;

    const script = document.createElement("script");
    script.id = 'google-apps-script';
    script.src = `https://script.google.com/macros/s/AKfycbwdQGsEV8yYmE9FyS47oyARI5wLpfnoa1ZO2SNi6LUuhcLtMDgwSz_84qT5FERrEE0lkQ/exec`;
    script.async = true;
    script.onerror = handleLoadError;
    
    // Add timeout for script loading
    const timeoutId = setTimeout(() => {
      if (loading && !scriptLoaded) {
        console.warn('Script loading timeout');
        handleLoadError();
      }
    }, 30000);

    // Check if script already exists
    const existingScript = document.getElementById('google-apps-script');
    if (existingScript) {
      console.log('Script already exists, reusing');
      document.body.removeChild(existingScript);
    }

    document.body.appendChild(script);

    return () => {
      clearTimeout(timeoutId);
      // Don't delete the callback during cleanup to avoid infinite loops
    };
  }, [handleDataLoad, handleLoadError, loading, scriptLoaded]);

  return { data, loading, error };
};