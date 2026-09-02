/**
 * Currency utility for CatererCo India Admin Panel
 * Handles AED ↔ INR conversion with Indian number formatting standards
 *
 * Exchange rate: 1 AED = ~22.77 INR (approximate, can be overridden by admin settings)
 */

export const CURRENCY_CONFIG = {
  AED: { symbol: "AED", name: "UAE Dirham", locale: "en-AE", flag: "🇦🇪" },
  INR: { symbol: "₹", name: "Indian Rupee", locale: "en-IN", flag: "🇮🇳" },
  USD: { symbol: "USD", name: "US Dollar", locale: "en-US", flag: "🇺🇸" },
  EUR: { symbol: "EUR", name: "Euro", locale: "en-EU", flag: "🇪🇺" },
  SAR: { symbol: "SAR", name: "Saudi Riyal", locale: "ar-SA", flag: "🇸🇦" },
};

// Default AED → INR exchange rate (1 AED = ~22.77 INR as of 2026)
export const DEFAULT_AED_TO_INR_RATE = 22.77;

/** Get the stored admin settings from localStorage */
export function getAdminSettings() {
  try {
    const saved = localStorage.getItem("admin_system_settings");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

/** Get the active display currency from admin settings */
export function getActiveCurrency() {
  const settings = getAdminSettings();
  return settings?.currency || "INR";
}

/** Get the AED→INR conversion rate from admin settings */
export function getAedToInrRate() {
  const settings = getAdminSettings();
  return settings?.aedToInrRate || DEFAULT_AED_TO_INR_RATE;
}

/**
 * Get conversion rate from one currency to another (AED as base)
 */
export function getConversionRate(from, to) {
  const settings = getAdminSettings();
  const aedToInr = settings?.aedToInrRate || DEFAULT_AED_TO_INR_RATE;
  const rates = { AED: 1, INR: aedToInr, USD: 0.272, EUR: 0.251, SAR: 1.02 };
  if (from === "AED") return rates[to] || 1;
  if (to === "AED") return 1 / (rates[from] || 1);
  return (1 / (rates[from] || 1)) * (rates[to] || 1);
}

/**
 * Convert an AED amount to the target currency
 */
export function convertFromAed(aedAmount, targetCurrency = null) {
  const currency = targetCurrency || getActiveCurrency();
  if (currency === "AED") return aedAmount;
  const rate = getConversionRate("AED", currency);
  return aedAmount * rate;
}

/**
 * Format a number as Indian Rupee (INR) using Indian number system
 */
export function formatINR(amount, compact = false) {
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Format a currency amount according to admin settings
 * @param {number} aedAmount - The raw amount stored in AED (database value)
 */
export function formatCurrency(aedAmount, options = {}) {
  const settings = getAdminSettings();
  const currency = options.currency || settings?.currency || "INR";
  const position = settings?.currencyPosition || "prefix";
  const convertedAmount = convertFromAed(aedAmount, currency);
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG["INR"];
  if (currency === "INR") return formatINR(convertedAmount, options.compact);
  const formatted = convertedAmount.toLocaleString(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (position === "suffix") return `${formatted} ${config.symbol}`;
  return `${config.symbol} ${formatted}`;
}

/** Get currency symbol for the active currency */
export function getCurrencySymbol() {
  const currency = getActiveCurrency();
  return CURRENCY_CONFIG[currency]?.symbol || "₹";
}

/**
 * Indian GST calculation helper
 */
export function calculateGST(amount, gstRate = 18) {
  const half = gstRate / 2;
  const cgst = (amount * half) / 100;
  const sgst = (amount * half) / 100;
  const igst = (amount * gstRate) / 100;
  return { base: amount, cgst, sgst, igst, total: amount + igst };
}
