// src/utils/index.js
const imageCache = new Map();

export const getColorCode = (color) => {
  if (!color) return "#7C3AED";
  const colorMap = {
    red: "#EF4444",
    blue: "#3B82F6",
    green: "#22C55E",
    black: "#111827",
    white: "#E5E7EB",
    pink: "#EC4899",
    yellow: "#F59E0B",
    purple: "#7C3AED",
    gray: "#6B7280",
    grey: "#6B7280",
    navy: "#1E40AF",
    teal: "#0D9488",
    orange: "#F97316"
  };

  const colorLower = color.toLowerCase();
  for (const [key, value] of Object.entries(colorMap)) {
    if (colorLower.includes(key)) return value;
  }
  return "#7C3AED";
};

export const getGoogleDriveThumbnail = (url) => {
  if (!url || typeof url !== 'string') return "/fallback-image.png";
  
  // Check cache first
  if (imageCache.has(url)) {
    return imageCache.get(url);
  }

  try {
    const fileIdMatch = url.match(/\/file\/d\/([^/]+)/) || 
                        url.match(/id=([^&]+)/) || 
                        url.match(/\/open\?id=([^&]+)/) || 
                        url.match(/\/d\/([^/]+)/) || 
                        url.match(/\/uc\?id=([^&]+)/);
    
    const fileId = fileIdMatch?.[1];
    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      return "/fallback-image.png";
    }
    
    // Use direct thumbnail URL for better loading
    const thumbnailUrl = `https://lh3.googleusercontent.com/d/${fileId}=s200`;
    imageCache.set(url, thumbnailUrl);
    return thumbnailUrl;
  } catch (e) {
    return "/fallback-image.png";
  }
};

export const getDateValue = (value) => {
  if (!value) return 0;
  try {
    let date;
    if (typeof value === 'number') {
      date = new Date((value - 25569) * 86400 * 1000);
    } else if (typeof value === 'string') {
      date = new Date(value.includes('/') ? value.split('/').reverse().join('-') : value);
    } else {
      date = new Date(value);
    }
    return isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
};

export const formatDate = (value) => {
  if (!value) return "";
  try {
    const dateValue = getDateValue(value);
    if (dateValue === 0) return String(value);
    
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(value);
  }
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "£0.00";
  
  try {
    const number = typeof value === 'string' 
      ? parseFloat(value.replace(/[^\d.-]/g, "")) 
      : Number(value);
    
    if (isNaN(number)) return "£0.00";
    
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  } catch {
    return "£0.00";
  }
};

export const compactSizes = (row) => {
  const sizes = [];
  for (let i = 4; i <= 26; i += 2) {
    const size = i.toString();
    const value = row[size];
    if (value !== undefined && value !== null && value !== "" && value !== "0") {
      sizes.push(`${size}:${value}`);
    }
  }
  return sizes.join(', ') || 'No sizes';
};

export const getGoogleDriveDownloadLink = (url) => {
  if (!url || typeof url !== 'string') return "";
  
  try {
    const fileId = url.match(/\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      return url;
    }
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  } catch (e) {
    return url;
  }
};

// Enhanced preload with error handling
export const preloadImage = (url) => {
  if (!url || imageCache.has(url)) return;
  
  const thumbnailUrl = getGoogleDriveThumbnail(url);
  const img = new Image();
  
  img.onload = () => {
    imageCache.set(url, thumbnailUrl);
  };
  
  img.onerror = () => {
    imageCache.set(url, "/fallback-image.png");
  };
  
  img.src = thumbnailUrl;
};

// Batch preload images
export const preloadImages = (urls) => {
  urls.forEach(url => {
    if (url) preloadImage(url);
  });
};