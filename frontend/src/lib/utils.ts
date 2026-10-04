/**
 * Utility and Formatting Functions for Fintech Visualizations.
 * Hack in Hills '26 - Team Holyknight
 */

export function formatINR(val: number, decimals: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(val);
}

export function formatPct(val: number, decimals: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return "0.00%";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(decimals)}%`;
}

export function formatZScore(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0.00σ";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}σ`;
}

export function formatDate(dateStr: string | number | undefined | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
