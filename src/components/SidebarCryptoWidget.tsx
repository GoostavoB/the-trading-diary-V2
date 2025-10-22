import { useState, useEffect } from 'react';
import { useCryptoPrice } from '@/hooks/useCryptoPrice';
import { TrendingUp, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

const AVAILABLE_TICKERS = [
  { symbol: 'BTCUSDT', display: 'BTC' },
  { symbol: 'ETHUSDT', display: 'ETH' },
  { symbol: 'BNBUSDT', display: 'BNB' },
  { symbol: 'SOLUSDT', display: 'SOL' },
  { symbol: 'XRPUSDT', display: 'XRP' },
  { symbol: 'SPX', display: 'S&P 500', isIndex: true },
  { symbol: 'BTC.D', display: 'BTC.D', isIndex: true },
];

export function SidebarCryptoWidget() {
  const { open } = useSidebar();
  
  // Load selected tickers from localStorage on mount
  const [selectedTickers, setSelectedTickers] = useState<string[]>(() => {
    const saved = localStorage.getItem('selectedCryptoTickers');
    return saved ? JSON.parse(saved) : ['BTCUSDT', 'ETHUSDT'];
  });
  
  const { prices, loading } = useCryptoPrice(selectedTickers);

  // Save selected tickers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedCryptoTickers', JSON.stringify(selectedTickers));
  }, [selectedTickers]);

  const toggleTicker = (symbol: string) => {
    setSelectedTickers(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  if (!open) {
    // Collapsed state - show icon only
    return (
      <div className="p-3 flex justify-center">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1.5">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-profit" />
          <span className="text-xs font-semibold text-muted-foreground">LIVE</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs hover:bg-muted/50"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 bg-popover/95 backdrop-blur-sm">
            {AVAILABLE_TICKERS.map(ticker => (
              <DropdownMenuCheckboxItem
                key={ticker.symbol}
                checked={selectedTickers.includes(ticker.symbol)}
                onCheckedChange={() => toggleTicker(ticker.symbol)}
                className="text-xs"
              >
                {ticker.display}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Prices */}
      {loading ? (
        <div className="text-[11px] text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-1">
          {prices.map((price) => {
            const isPositive = price.priceChangePercent >= 0;
            
            return (
              <div key={price.symbol} className="flex items-center justify-between text-[11px] leading-tight">
                <span className="font-semibold text-foreground">
                  {price.displaySymbol}
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-medium text-foreground">
                    ${price.price}
                  </span>
                  <span className={`font-mono ${isPositive ? 'text-profit' : 'text-loss'}`}>
                    {isPositive ? '↗' : '↘'}{isPositive ? '+' : ''}{price.priceChangePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}