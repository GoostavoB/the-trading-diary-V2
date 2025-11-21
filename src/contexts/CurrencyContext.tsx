import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useSubAccount } from './SubAccountContext';
import { useExchangeRates } from '@/hooks/useExchangeRates';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

// Base currency definitions (rates will be updated from API)
const BASE_CURRENCIES: Omit<Currency, 'rate'>[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BTC', symbol: '₿', name: 'Bitcoin' },
  { code: 'ETH', symbol: 'Ξ', name: 'Ethereum' },
];

// Default fallback rates (used only if API fails)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
  BRL: 4.98,
  INR: 83.25,
  BTC: 0.000023,
  ETH: 0.00031,
};

export let SUPPORTED_CURRENCIES: Currency[] = BASE_CURRENCIES.map(c => ({
  ...c,
  rate: FALLBACK_RATES[c.code],
}));

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertAmount: (amount: number, fromCurrency?: string) => number;
  formatAmount: (amount: number, options?: Intl.NumberFormatOptions) => string;
  lastUpdate: string | null;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { activeSubAccount } = useSubAccount();
  const [currency, setCurrencyState] = useState<Currency>(SUPPORTED_CURRENCIES[0]); // Default to USD
  const { data: exchangeRates, isLoading } = useExchangeRates();

  // Update SUPPORTED_CURRENCIES with real rates when available
  useEffect(() => {
    if (exchangeRates) {
      console.log('Updating currency rates with real data');
      
      const updatedCurrencies = BASE_CURRENCIES.map(c => {
        let rate = FALLBACK_RATES[c.code];

        if (c.code === 'BTC' && exchangeRates.crypto.bitcoin) {
          rate = 1 / exchangeRates.crypto.bitcoin.usd;
        } else if (c.code === 'ETH' && exchangeRates.crypto.ethereum) {
          rate = 1 / exchangeRates.crypto.ethereum.usd;
        } else if (c.code === 'USD') {
          rate = 1.00;
        } else if (exchangeRates.fiat[c.code]) {
          rate = exchangeRates.fiat[c.code];
        }

        return { ...c, rate };
      });

      SUPPORTED_CURRENCIES = updatedCurrencies;

      // Update current currency with new rate
      const updatedCurrency = updatedCurrencies.find(c => c.code === currency.code);
      if (updatedCurrency) {
        setCurrencyState(updatedCurrency);
      }
    }
  }, [exchangeRates]);

  useEffect(() => {
    if (user && activeSubAccount) {
      loadUserCurrency();
    }
  }, [user, activeSubAccount]);

  const loadUserCurrency = async () => {
    if (!activeSubAccount) return;
    
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('display_currency')
        .eq('sub_account_id', activeSubAccount.id)
        .maybeSingle();

      if (data?.display_currency) {
        const savedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === data.display_currency);
        if (savedCurrency) {
          setCurrencyState(savedCurrency);
        }
      }
    } catch (error) {
      console.error('Error loading currency preference:', error);
    }
  };

  const setCurrency = async (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    
    if (user && activeSubAccount) {
      try {
        await supabase
          .from('user_settings')
          .update({ display_currency: newCurrency.code })
          .eq('sub_account_id', activeSubAccount.id);
      } catch (error) {
        console.error('Error saving currency preference:', error);
      }
    }
  };

  /**
   * Convert an amount from one currency to another
   * @param amount - The amount to convert (in the source currency)
   * @param fromCurrency - The source currency code (defaults to 'USD')
   * @returns The converted amount in the currently selected currency
   * 
   * @example
   * // If current currency is BRL and rate is 5.38
   * convertAmount(100) // Returns 538 (100 USD → 538 BRL)
   */
  const convertAmount = (amount: number, fromCurrency: string = 'USD'): number => {
    // If amount is already in target currency, return as is
    if (fromCurrency === currency.code) {
      return amount;
    }

    // Convert from source currency to USD first (if needed)
    const sourceCurrency = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency);
    const amountInUSD = sourceCurrency ? amount / sourceCurrency.rate : amount;

    // Then convert from USD to target currency
    return amountInUSD * currency.rate;
  };

  /**
   * Format an amount with currency symbol
   * ⚠️ IMPORTANT: This function internally calls convertAmount()
   * Do NOT call convertAmount() before this function, or the value will be converted twice!
   * 
   * @param amount - The amount in USD (will be converted automatically)
   * @param options - Optional Intl.NumberFormat options
   * @returns Formatted string with currency symbol
   * 
   * @example
   * // ✅ CORRECT - formatAmount handles conversion
   * formatAmount(2047) // "$2,047.00" (USD) or "R$11,013.00" (BRL)
   * 
   * // ❌ WRONG - double conversion!
   * formatAmount(convertAmount(2047)) // Will convert twice!
   */
  const formatAmount = (amount: number, options?: Intl.NumberFormatOptions): string => {
    const convertedAmount = convertAmount(amount);
    const sign = convertedAmount < 0 ? '-' : '';
    const absValue = Math.abs(convertedAmount);

    // Crypto currencies need more decimal places
    if (currency.code === 'BTC' || currency.code === 'ETH') {
      return `${sign}${currency.symbol}${absValue.toFixed(8)}`;
    }

    // Large amounts - no decimals
    if (absValue >= 1000000) {
      return `${sign}${currency.symbol}${(absValue / 1000000).toFixed(2)}M`;
    }
    if (absValue >= 10000) {
      return `${sign}${currency.symbol}${(absValue / 1000).toFixed(1)}K`;
    }
    if (absValue >= 100) {
      return `${sign}${currency.symbol}${absValue.toFixed(0)}`;
    }
    
    return `${sign}${currency.symbol}${absValue.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      convertAmount, 
      formatAmount,
      lastUpdate: exchangeRates?.timestamp || null,
      isLoading,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
