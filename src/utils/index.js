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