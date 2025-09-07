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
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Date value extraction function
export const getDateValue = (dateString) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  return date.getTime();
};

// Currency formatting function
export const formatCurrency = (amount) => {
  if (!amount) return "£0.00";
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

// Google Drive thumbnail URL generator
export const getGoogleDriveThumbnail = (url) => {
  if (!url) return "";
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/[-\w]{25,}/);
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId[0]}&sz=w1000`;
    }
  }
  return url;
};

// Google Drive download link generator
export const getGoogleDriveDownloadLink = (url) => {
  if (!url) return "";
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/[-\w]{25,}/);
    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${fileId[0]}`;
    }
  }
  return url;
};

// Size compacting function
export const compactSizes = (sizes) => {
  if (!sizes || !Array.isArray(sizes)) return "";
  return sizes.join(', ');
};