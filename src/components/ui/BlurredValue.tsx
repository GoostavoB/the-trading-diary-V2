import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { useBlur } from '@/contexts/BlurContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

interface BlurredValueProps {
  value: string | number;
  className?: string;
  showToggle?: boolean;
  prefix?: string;
  suffix?: string;
}

export const BlurredValue = ({ 
  value, 
  className, 
  showToggle = false,
  prefix = '',
  suffix = ''
}: BlurredValueProps) => {
  const { isBlurred } = useBlur();
  const [localOverride, setLocalOverride] = useState(false);
  
  const shouldBlur = isBlurred && !localOverride;

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          "transition-all duration-200",
          shouldBlur && "blur-md select-none",
          className
        )}
      >
        {prefix}{value}{suffix}
      </span>
      {showToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setLocalOverride(!localOverride)}
        >
          {shouldBlur ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
};

// Helper component for currency values
export const BlurredCurrency = ({ 
  amount, 
  className,
  showToggle = false 
}: { 
  amount: number; 
  className?: string;
  showToggle?: boolean;
}) => {
  const { currency, formatAmount } = useCurrency();
  // formatAmount already handles conversion internally - don't call convertAmount separately!
  const formattedValue = formatAmount(amount);
  // Remove the currency symbol from the formatted string to use it as prefix
  const valueWithoutSymbol = formattedValue.replace(currency.symbol, '').trim();
  
  return (
    <BlurredValue
      value={valueWithoutSymbol}
      prefix={currency.symbol}
      className={className}
      showToggle={showToggle}
    />
  );
};

// Helper component for percentage values
export const BlurredPercent = ({ 
  value, 
  className,
  showToggle = false 
}: { 
  value: number; 
  className?: string;
  showToggle?: boolean;
}) => {
  return (
    <BlurredValue
      value={value.toFixed(2)}
      suffix="%"
      className={className}
      showToggle={showToggle}
    />
  );
};
