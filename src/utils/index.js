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

// Date formatting function
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

// Date value extraction function
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

// Currency formatting function
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

// Google Drive thumbnail URL generator
export const getGoogleDriveThumbnail = (url) => {
  console.log("getGoogleDriveThumbnail called with URL:", url); // Debug log
  if (!url || typeof url !== 'string') {
    console.warn("Invalid or missing URL for thumbnail:", url);
    return "/fallback-image.png";
  }
  try {
    // Support multiple Google Drive URL formats
    const fileIdMatch = url.match(/\/file\/d\/([^/]+)/) || 
                        url.match(/id=([^&]+)/) || 
                        url.match(/\/open\?id=([^&]+)/) || 
                        url.match(/\/d\/([^/]+)/) || 
                        url.match(/\/uc\?id=([^&]+)/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    if (!fileId) {
      console.warn("No valid file ID found in URL:", url);
      return "/fallback-image.png";
    }
    // Validate file ID format (alphanumeric with optional hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      console.warn("Invalid file ID format:", fileId, "URL:", url);
      return "/fallback-image.png";
    }
    // Use smaller thumbnail size for faster loading
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=s200`;
    console.log("Generated thumbnail URL:", thumbnailUrl); // Debug log
    return thumbnailUrl;
  } catch (e) {
    console.error("Error generating thumbnail URL:", e, "Original URL:", url);
    return "/fallback-image.png";
  }
};

// Google Drive download link generator
export const getGoogleDriveDownloadLink = (url) => {
  console.log("getGoogleDriveDownloadLink called with URL:", url); // Debug log
  if (!url || typeof url !== 'string') {
    console.warn("Invalid or missing URL for download link:", url);
    return "";
  }
  try {
    const fileId = url.match(/\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    if (!fileId) {
      console.warn("No valid file ID found in URL:", url);
      return url;
    }
    // Validate file ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      console.warn("Invalid file ID format:", fileId, "URL:", url);
    }
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    console.log("Generated download URL:", downloadUrl); // Debug log
    return downloadUrl;
  } catch (e) {
    console.error("Error generating download URL:", e, "URL:", url);
    return url;
  }
};

// Size compacting function
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