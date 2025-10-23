import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency, SUPPORTED_CURRENCIES } from '@/contexts/CurrencyContext';
import { DollarSign } from 'lucide-react';

export const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrency();

  const handleCurrencyChange = (code: string) => {
    const selected = SUPPORTED_CURRENCIES.find(c => c.code === code);
    if (selected) {
      setCurrency(selected);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <CardTitle>Currency</CardTitle>
        </div>
        <CardDescription>
          Choose your preferred currency for displaying values
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Display Currency</Label>
          <Select value={currency.code} onValueChange={handleCurrencyChange}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{curr.symbol}</span>
                    <span>{curr.name}</span>
                    <span className="text-muted-foreground">({curr.code})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Exchange rates are approximate and updated periodically.
            All trade data is stored in USD and converted for display only.
          </p>
        </div>

        {/* Currency Info */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Selected Currency:</span>
            <span className="font-semibold">{currency.name} ({currency.code})</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Symbol:</span>
            <span className="font-semibold">{currency.symbol}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Exchange Rate:</span>
            <span className="font-semibold">1 USD = {currency.rate.toFixed(2)} {currency.code}</span>
          </div>
        </div>

        {/* Example */}
        <div className="p-4 rounded-lg border">
          <p className="text-sm text-muted-foreground mb-2">Example:</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-mono">$1,000 USD</span>
              <span className="mx-2">→</span>
              <span className="font-mono font-semibold">{currency.symbol}{(1000 * currency.rate).toFixed(2)} {currency.code}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
