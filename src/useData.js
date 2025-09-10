import { useState, useEffect } from 'react';

export const useData = () => {
  const [data, setData] = useState({
    sales_po: [],
    fabric: [],
    insert_pattern: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timeoutId = null;
    let script = null;
    let callbackName = null;
    let isMounted = true;

    const fetchData = () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        setError(null);

        // Timeout after 15 seconds
        timeoutId = setTimeout(() => {
          if (!isMounted) return;
          console.log('Data loading timeout - using empty data');
          setData({
            sales_po: [],
            fabric: [],
            insert_pattern: []
          });
          setLoading(false);
          setError("Data loading timeout. Check internet connection.");
        }, 15000);

        // Create a unique callback name
        callbackName = `jsonpCallback_${Date.now()}`;
        
        // Define the callback function with error handling
        window[callbackName] = (fetchedData) => {
          if (!isMounted) return;
          console.log('Google Script callback executed with data:', fetchedData);
          clearTimeout(timeoutId);
          
          try {
            if (fetchedData && typeof fetchedData === 'object') {
              setData({
                sales_po: fetchedData.sales_po || [],
                fabric: fetchedData.fabric || [],
                insert_pattern: fetchedData.insert_pattern || []
              });
            } else {
              console.warn('Invalid data format received from Google Script');
              setData({
                sales_po: [],
                fabric: [],
                insert_pattern: []
              });
              setError("Invalid data format received from server.");
            }
          } catch (e) {
            console.error('Error processing data from Google Script:', e);
            setData({
              sales_po: [],
              fabric: [],
              insert_pattern: []
            });
            setError("Error processing data: " + e.message);
          }
          
          setLoading(false);
          
          // Clean up the callback
          try {
            delete window[callbackName];
          } catch (cleanupError) {
            console.warn('Error cleaning up callback:', cleanupError);
          }
        };

        // Create and load the script
        script = document.createElement('script');
        const scriptUrl = `https://script.google.com/macros/s/AKfycbwdQGsEV8yYmE9FyS47oyARI5wLpfnoa1ZO2SNi6LUuhcLtMDgwSz_84qT5FERrEE0lkQ/exec?callback=${callbackName}`;
        script.src = scriptUrl;
        script.async = true;
        
        script.onload = () => {
          console.log('Google Script loaded successfully');
        };
        
        script.onerror = (scriptError) => {
          if (!isMounted) return;
          console.error('Google Script failed to load:', scriptError);
          clearTimeout(timeoutId);
          setData({
            sales_po: [],
            fabric: [],
            insert_pattern: []
          });
          setLoading(false);
          setError("Failed to load data from Google Sheets. Please check your internet connection and try again.");
          
          // Clean up the callback
          try {
            delete window[callbackName];
          } catch (cleanupError) {
            console.warn('Error cleaning up callback after script error:', cleanupError);
          }
        };

        // Add the script to the document
        document.head.appendChild(script);

      } catch (e) {
        if (!isMounted) return;
        console.error('Error in fetchData setup:', e);
        setData({
          sales_po: [],
          fabric: [],
          insert_pattern: []
        });
        setLoading(false);
        setError("Error setting up data loading: " + e.message);
      }
    };

    // Call the fetch function
    fetchData();

    // Return cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (script && script.parentNode) {
        document.head.removeChild(script);
      }
      if (callbackName) {
        try {
          delete window[callbackName];
        } catch (cleanupError) {
          console.warn('Error in final cleanup:', cleanupError);
        }
      }
    };

  }, []);

  return { data, loading, error };
};