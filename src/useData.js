import { useState, useEffect } from 'react';

export const useData = () => {
  const [data, setData] = useState({
    sales_po: [],
    fabric_po: [],
    insert_pattern: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    window.jsonpCallback = (fetched) => {
      console.log('JSONP Response:', fetched); // Debug the full response
      try {
        setData({
          sales_po: fetched.sales_po || [],
          fabric_po: fetched.fabric_po || [],
          insert_pattern: fetched.insert_pattern || []
        });
        console.log('Insert Pattern keys:', Object.keys(fetched.insert_pattern[0] || {}));
      } catch (e) {
        setError("Error Parsing Data: " + e.message);
        console.error('Parse Error:', e);
      } finally {
        setLoading(false); // Ensure loading is set to false even on error
      }
    };

    const script = document.createElement("script");
    script.src = `https://script.google.com/macros/s/AKfycbwdQGsEV8yYmE9FyS47oyARI5wLpfnoa1ZO2SNi6LUuhcLtMDgwSz_84qT5FERrEE0lkQ/exec`;
    script.async = true;
    script.onerror = () => {
      setError("Failed to Load Data from Google Apps Script");
      setLoading(false); // Ensure loading is set to false on error
      console.error('Script Load Error');
    };
    document.body.appendChild(script);

    // Cleanup
    return () => {
      delete window.jsonpCallback;
      document.body.removeChild(script);
    };
  }, []);

  return { data, loading, error };
};