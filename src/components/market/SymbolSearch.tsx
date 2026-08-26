import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface SymbolOption {
  value: string; // e.g. BTCUSDT
  label: string; // e.g. BTC/USDT
}

const FALLBACK_SYMBOLS: SymbolOption[] = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'POLUSDT', '1000SHIBUSDT',
].map((s) => ({ value: s, label: `${s.replace('USDT', '')}/USDT` }));

let cachedSymbols: SymbolOption[] | null = null;

export function formatSymbolLabel(symbol: string) {
  return symbol.endsWith('USDT') ? `${symbol.replace(/USDT$/, '')}/USDT` : symbol;
}

interface SymbolSearchProps {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
}

export function SymbolSearch({ value, onChange, className }: SymbolSearchProps) {
  const [open, setOpen] = useState(false);
  const [symbols, setSymbols] = useState<SymbolOption[]>(cachedSymbols ?? FALLBACK_SYMBOLS);
  const [loading, setLoading] = useState(!cachedSymbols);

  useEffect(() => {
    if (cachedSymbols) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo');
        if (!res.ok) throw new Error('Failed to load symbols');
        const json = await res.json();
        const list: SymbolOption[] = (json?.symbols ?? [])
          .filter(
            (s: any) =>
              s.status === 'TRADING' &&
              s.contractType === 'PERPETUAL' &&
              s.quoteAsset === 'USDT'
          )
          .map((s: any) => ({ value: s.symbol, label: `${s.baseAsset}/USDT` }))
          .sort((a: SymbolOption, b: SymbolOption) => a.label.localeCompare(b.label));

        if (list.length > 0) {
          cachedSymbols = list;
          if (!cancelled) setSymbols(list);
        }
      } catch (error) {
        console.error('Error loading Binance symbols:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedLabel = useMemo(
    () => symbols.find((s) => s.value === value)?.label ?? formatSymbolLabel(value),
    [symbols, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-semibold', className)}
        >
          {selectedLabel}
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-60" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search symbol (e.g. XRP)" />
          <CommandList>
            <CommandEmpty>No symbol found.</CommandEmpty>
            <CommandGroup>
              {symbols.map((s) => (
                <CommandItem
                  key={s.value}
                  value={`${s.label} ${s.value}`}
                  onSelect={() => {
                    onChange(s.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === s.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {s.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
