import { DollarSign } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrency, SUPPORTED_CURRENCIES } from '@/contexts/CurrencyContext';
import { CurrencyUpdateIndicator } from './CurrencyUpdateIndicator';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          <span>{currency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Display Currency</span>
        </DropdownMenuLabel>
        <div className="px-2 pb-2">
          <CurrencyUpdateIndicator />
        </div>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Fiat Currencies
        </DropdownMenuLabel>
        {SUPPORTED_CURRENCIES.filter(c => !['BTC', 'ETH'].includes(c.code)).map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr)}
            className="flex items-center gap-3 justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{curr.symbol}</span>
              <div>
                <div className="font-medium text-sm">{curr.code}</div>
                <div className="text-xs text-muted-foreground">{curr.name}</div>
              </div>
            </div>
            {currency.code === curr.code && (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Cryptocurrencies
        </DropdownMenuLabel>
        {SUPPORTED_CURRENCIES.filter(c => ['BTC', 'ETH'].includes(c.code)).map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr)}
            className="flex items-center gap-3 justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{curr.symbol}</span>
              <div>
                <div className="font-medium text-sm">{curr.code}</div>
                <div className="text-xs text-muted-foreground">{curr.name}</div>
              </div>
            </div>
            {currency.code === curr.code && (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
