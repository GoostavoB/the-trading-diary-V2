import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.00 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.50 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.88 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 4.98 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.25 },
  { code: 'BTC', symbol: '₿', name: 'Bitcoin', rate: 0.000023 },
  { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', rate: 0.00031 },
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
      const { data } = await supabase
        .from('user_settings')
        .select('display_currency')
        .eq('user_id', user!.id)
        .single();

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
    
    if (user) {
      try {
        await supabase
          .from('user_settings')
          .update({ display_currency: newCurrency.code })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving currency preference:', error);
      }
    }
  };

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
