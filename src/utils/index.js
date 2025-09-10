// src/utils/index.js
export const getColorCode = (color) => {
  if (!color) return "#7C3AED";
  const colorLower = color.toLowerCase();
  if (colorLower.includes("red")) return "#EF4444";
  if (colorLower.includes("blue")) return "#3B82F6";
  if (colorLower.includes("green")) return "#22C55E";
  if (colorLower.includes("black")) return "#111827";
  if (colorLower.includes("white")) return "#E5E7EB";
  if (colorLower.includes("pink")) return "#EC4899";
  if (colorLower.includes("yellow")) return "#F59E0B";
  if (colorLower.includes("purple")) return "#7C3AED";
  if (colorLower.includes("gray") || colorLower.includes("grey")) return "#6B7280";
  if (colorLower.includes("navy")) return "#1E40AF";
  if (colorLower.includes("teal")) return "#0D9488";
  if (colorLower.includes("orange")) return "#F97316";
  return "#7C3AED";
};

export const getGoogleDriveThumbnail = (url) => {
  if (!url || typeof url !== 'string') {
    return "/fallback-image.png";
  }
  
  try {
    // Extract file ID from various Google Drive URL formats
    const fileIdMatch = url.match(/\/file\/d\/([^/]+)/) || 
                        url.match(/id=([^&]+)/) || 
                        url.match(/\/open\?id=([^&]+)/) || 
                        url.match(/\/d\/([^/]+)/) || 
                        url.match(/\/uc\?id=([^&]+)/);
    
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      return "/fallback-image.png";
    }
    
    // Use webp format for faster loading and smaller size
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=s200&export=download&format=webp`;
  } catch (e) {
    return "/fallback-image.png";
  }
};

export const getDateValue = (value) => {
  if (!value) return 0;
  let date;
  if (typeof value === 'number') {
    date = new Date((value - 25569) * 86400 * 1000);
  } else {
    date = new Date(value);
  }
  return isNaN(date.getTime()) ? 0 : date.getTime();
};

export const formatDate = (value) => {
  if (!value) return "";
  try {
    let date;
    if (typeof value === 'number') {
      date = new Date((value - 25569) * 86400 * 1000);
    } else {
      date = new Date(value);
    }
    if (isNaN(date.getTime())) return String(value);
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
  if (!value) return "£0.00";
  const number = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
};

export const compactSizes = (row) => {
  const sizes = [];
  for (let i = 4; i <= 26; i += 2) {
    const size = i.toString();
    if (row[size]) {
      sizes.push(`${size}:${row[size]}`);
    }
  }
  return sizes.join(', ');
};

export const getGoogleDriveDownloadLink = (url) => {
  if (!url || typeof url !== 'string') {
    return "";
  }
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

// Preload images for instant loading
export const preloadImage = (url) => {
  if (!url) return;
  const img = new Image();
  img.src = getGoogleDriveThumbnail(url);
};