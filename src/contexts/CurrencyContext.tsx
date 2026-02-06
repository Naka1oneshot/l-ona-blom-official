import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Currency, CURRENCY_SYMBOLS } from '@/types';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (cents: number, overrides?: Partial<Record<Currency, number>>) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CONVERSION_RATES: Record<Currency, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  CAD: 1.47,
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('EUR');

  const formatPrice = (centsEur: number, overrides?: Partial<Record<Currency, number>>) => {
    let cents: number;
    if (overrides && overrides[currency] !== undefined) {
      cents = overrides[currency]!;
    } else {
      cents = Math.round(centsEur * CONVERSION_RATES[currency]);
    }
    const amount = (cents / 100).toFixed(2);
    return `${CURRENCY_SYMBOLS[currency]}${amount}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
