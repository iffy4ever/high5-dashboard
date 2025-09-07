import { useState, useEffect } from 'react';

export const useData = () => {
  const [data, setData] = useState({
    sales_po: [],
    fabric: [], // Changed from fabric_po to fabric
    insert_pattern: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    window.jsonpCallback = (fetched) => {
      try {
        console.log('Raw fetched data:', fetched); // Debug log
        
        setData({
          sales_po: fetched.sales_po || [],
          fabric: fetched.fabric || fetched.fabric_po || [], // Handle both fabric and fabric_po
          insert_pattern: fetched.insert_pattern || []
        });
        
        console.log('Fabric data sample:', fetched.fabric ? fetched.fabric[0] : 'No fabric data');
        console.log('Fabric keys:', fetched.fabric ? Object.keys(fetched.fabric[0] || {}) : 'No fabric keys');
      } catch (e) {
        setError("Error Parsing Data: " + e.message);
        console.error('Data parsing error:', e);
      }
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://script.google.com/macros/s/AKfycbwdQGsEV8yYmE9FyS47oyARI5wLpfnoa1ZO2SNi6LUuhcLtMDgwSz_84qT5FERrEE0lkQ/exec`;
    script.async = true;
    script.onerror = () => {
      setError("Failed To Load Data - Check internet connection");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      delete window.jsonpCallback;
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return { data, loading, error };
};