import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Conversion rate from USD
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.50 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.88 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 4.98 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.25 },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertAmount: (amount: number, fromCurrency?: string) => number;
  formatAmount: (amount: number, options?: Intl.NumberFormatOptions) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<Currency>(SUPPORTED_CURRENCIES[0]); // Default to USD

  useEffect(() => {
    if (user) {
      loadUserCurrency();
    }
  }, [user]);

  const loadUserCurrency = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('currency')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading currency:', error);
        return;
      }

      if (data?.currency) {
        const userCurrency = SUPPORTED_CURRENCIES.find(c => c.code === data.currency);
        if (userCurrency) {
          setCurrencyState(userCurrency);
        }
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  };

  const setCurrency = async (newCurrency: Currency) => {
    setCurrencyState(newCurrency);

    if (user) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .update({ currency: newCurrency.code })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error saving currency:', error);
        }
      } catch (error) {
        console.error('Error saving currency:', error);
      }
    }
  };

  const convertAmount = (amount: number, fromCurrency: string = 'USD'): number => {
    if (!amount || isNaN(amount)) return 0;
    
    // Convert to USD first if needed
    const fromRate = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency)?.rate || 1;
    const amountInUSD = amount / fromRate;
    
    // Then convert to target currency
    return amountInUSD * currency.rate;
  };

  const formatAmount = (amount: number, options?: Intl.NumberFormatOptions): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return `${currency.symbol}0`;
    
    const absValue = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    
    // Format large numbers with K, M, B suffixes
    if (absValue >= 1_000_000_000) {
      return `${sign}${currency.symbol}${(absValue / 1_000_000_000).toFixed(absValue >= 10_000_000_000 ? 0 : 1)}B`;
    }
    if (absValue >= 1_000_000) {
      return `${sign}${currency.symbol}${(absValue / 1_000_000).toFixed(absValue >= 10_000_000 ? 0 : 1)}M`;
    }
    if (absValue >= 1_000) {
      return `${sign}${currency.symbol}${(absValue / 1_000).toFixed(absValue >= 10_000 ? 0 : 1)}K`;
    }
    if (absValue >= 100) {
      return `${sign}${currency.symbol}${absValue.toFixed(0)}`;
    }
    
    return `${sign}${currency.symbol}${amount.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertAmount, formatAmount }}>
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
