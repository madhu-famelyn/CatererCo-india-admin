import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CURRENCY_CONFIG, DEFAULT_AED_TO_INR_RATE, formatINR, formatCurrency } from "./currency";

const CurrencyContext = createContext(null);

/** India admin default — used on SSR AND the first client render (must match). */
const INDIA_DEFAULTS = {
  currency: "INR",
  currencyPosition: "prefix",
  aedToInrRate: DEFAULT_AED_TO_INR_RATE,
};

/** Read + migrate localStorage settings. Only called on the client after hydration. */
function readClientSettings() {
  try {
    const raw = localStorage.getItem("admin_system_settings");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migration: old UAE default → India default
    if (!parsed.currency || parsed.currency === "AED") {
      parsed.currency = "INR";
    }
    if (!parsed.aedToInrRate) {
      parsed.aedToInrRate = DEFAULT_AED_TO_INR_RATE;
    }
    // Persist the migrated version back
    localStorage.setItem("admin_system_settings", JSON.stringify(parsed));
    return parsed;
  } catch (_) {
    return null;
  }
}

export function CurrencyProvider({ children }) {
  // ⚠️  ALWAYS start with INDIA_DEFAULTS so SSR HTML matches the first client render.
  //     Never read localStorage here — it causes hydration mismatches.
  const [settings, setSettings] = useState(INDIA_DEFAULTS);

  // After hydration is complete, safely switch to the user's saved settings.
  useEffect(() => {
    const clientSettings = readClientSettings();
    if (clientSettings) {
      setSettings((prev) => ({ ...prev, ...clientSettings }));
    }

    // Listen for cross-tab storage changes
    const onStorage = (e) => {
      if (e.key === "admin_system_settings" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (!parsed.currency || parsed.currency === "AED") parsed.currency = "INR";
          if (!parsed.aedToInrRate) parsed.aedToInrRate = DEFAULT_AED_TO_INR_RATE;
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch (_) {}
      }
    };
    window.addEventListener("storage", onStorage);

    // Poll every 1.5s to pick up same-tab Settings saves
    const poll = setInterval(() => {
      const latest = readClientSettings();
      if (latest) {
        setSettings((prev) => {
          if (
            prev.currency !== latest.currency ||
            prev.aedToInrRate !== latest.aedToInrRate ||
            prev.currencyPosition !== latest.currencyPosition
          ) {
            return { ...prev, ...latest };
          }
          return prev;
        });
      }
    }, 1500);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(poll);
    };
  }, []);

  const currency = settings.currency || "INR";
  const rate = settings.aedToInrRate || DEFAULT_AED_TO_INR_RATE;
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG["INR"];
  const position = settings.currencyPosition || "prefix";

  /**
   * fmt(aedAmount) — convert a raw AED database value to the display currency.
   * Uses the admin-configured exchange rate (not a global lookup).
   */
  const fmt = useCallback(
    (aedAmount, compact = false) => {
      if (aedAmount == null || isNaN(aedAmount)) return `${config.symbol} —`;
      const num = Number(aedAmount);

      if (currency === "INR") {
        return formatINR(num * rate, compact);
      }

      if (currency === "AED") {
        const formatted = num.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        return position === "suffix" ? `${formatted} AED` : `AED ${formatted}`;
      }

      // Other currencies — convert via INR as intermediate
      const inr = num * rate;
      const approxFromInr = { USD: 0.012, EUR: 0.011, SAR: 0.045 };
      const converted = inr * (approxFromInr[currency] || 1);
      const formatted = converted.toLocaleString(config.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      return position === "suffix" ? `${formatted} ${config.symbol}` : `${config.symbol} ${formatted}`;
    },
    [currency, rate, config, position]
  );

  return (
    <CurrencyContext.Provider value={{ currency, rate, config, fmt, settings }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: "INR",
      rate: DEFAULT_AED_TO_INR_RATE,
      config: CURRENCY_CONFIG["INR"],
      fmt: (v) => formatCurrency(v),
      settings: INDIA_DEFAULTS,
    };
  }
  return ctx;
}
