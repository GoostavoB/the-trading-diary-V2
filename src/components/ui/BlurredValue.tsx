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

// ── Dinheiro em tres moedas: dolar, euro e real ────────────────────────────
// A linha de cima e a moeda selecionada no topo do app; abaixo vem as outras
// duas de [USD, EUR, BRL] com a bandeirinha. Opt-in: so onde a gente pedir,
// para nao rebentar o layout das tabelas que usam BlurredCurrency inline.
const BANDEIRA: Record<string, string> = { USD: '\u{1F1FA}\u{1F1F8}', EUR: '\u{1F1EA}\u{1F1FA}', BRL: '\u{1F1E7}\u{1F1F7}' };
const TRIO = ['USD', 'EUR', 'BRL'];

export const MultiCurrency = ({
  amount,
  className,
  showToggle = false,
  secondaryClassName,
}: {
  amount: number;
  className?: string;
  showToggle?: boolean;
  secondaryClassName?: string;
}) => {
  const { currency, formatIn } = useCurrency();
  const principal = TRIO.includes(currency.code) ? currency.code : 'USD';
  const outras = TRIO.filter(c => c !== principal);

  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center gap-1.5">
        <BlurredValue value={formatIn(principal, amount)} className={className} showToggle={showToggle} />
        <span aria-hidden className="text-[0.7em] leading-none opacity-80">{BANDEIRA[principal]}</span>
      </div>
      <div className={cn("flex flex-col gap-0.5 text-fluid-xs text-muted-foreground/60 tabular-nums", secondaryClassName)}>
        {outras.map(code => (
          <span key={code} className="inline-flex items-center gap-1.5">
            <BlurredValue value={formatIn(code, amount)} />
            <span aria-hidden className="text-[0.85em] leading-none opacity-80">{BANDEIRA[code]}</span>
          </span>
        ))}
      </div>
    </div>
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
