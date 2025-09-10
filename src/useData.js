// src/useData.js
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
        setData({
          sales_po: fetched.sales_po || [],
          fabric: fetched.fabric || fetched.fabric_po || [], // Handle both naming conventions
          insert_pattern: fetched.insert_pattern || []
        });
        console.log('Data loaded - Sales:', fetched.sales_po?.length, 'Fabric:', fetched.fabric?.length || fetched.fabric_po?.length, 'Developments:', fetched.insert_pattern?.length);
      } catch (e) {
        setError("Error Parsing Data");
        console.error(e);
      }
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://script.google.com/macros/s/AKfycbwdQGsEV8yYmE9FyS47oyARI5wLpfnoa1ZO2SNi6LUuhcLtMDgwSz_84qT5FERrEE0lkQ/exec`;
    script.async = true;
    script.onerror = () => {
      setError("Failed To Load Data");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      delete window.jsonpCallback;
      document.body.removeChild(script);
    };
  }, []);

  return { data, loading, error };
};