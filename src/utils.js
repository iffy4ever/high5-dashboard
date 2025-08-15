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

export const getGoogleDriveThumbnail = (url) => {
  if (!url) return "";
  try {
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    if (!fileId) {
      console.warn("No valid file ID found in URL:", url);
      return "";
    }
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  } catch (e) {
    console.error("Error generating thumbnail URL:", e);
    return "";
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
  const sizes = ["4", "6", "8", "10", "12", "14", "16", "18"];
  return sizes.map(s => row[s] ? `${s}-${row[s]}` : "").filter(Boolean).join(", ");
};

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