import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CalendarIcon, ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTokenSearch } from '@/hooks/useTokenSearch';
import { isValidDecimal, parseDecimalInput } from '@/utils/numberFormatting';

interface AddTokenModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (token: {
    token_symbol: string;
    token_name: string;
    quantity: number;
    purchase_price?: number;
    purchase_date?: string;
    exchange?: string;
    notes?: string;
  }) => void;
}

const POPULAR_TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'AVAX', name: 'Avalanche' },
];

const EXCHANGES = [
  "Binance",
  "BingX",
  "Bitfinex",
  "Bitget",
  "Bitstamp",
  "Bithumb",
  "Bybit",
  "Coinbase",
  "Crypto.com Exchange",
  "Gate.io",
  "Gemini",
  "Huobi",
  "Kraken",
  "KuCoin",
  "MEXC",
  "OKX",
  "Uniswap",
  "Other"
].sort();

export const AddTokenModal = ({ open, onClose, onAdd }: AddTokenModalProps) => {
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date>();
  const [exchange, setExchange] = useState('');
  const [notes, setNotes] = useState('');
  const [openExchange, setOpenExchange] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTokenResults, setShowTokenResults] = useState(false);
  
  const { results: tokenResults, loading: searchLoading } = useTokenSearch(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAdd({
      token_symbol: tokenSymbol.toUpperCase(),
      token_name: tokenName,
      quantity: parseDecimalInput(quantity) || 0,
      purchase_price: purchasePrice ? parseDecimalInput(purchasePrice) || undefined : undefined,
      purchase_date: purchaseDate?.toISOString(),
      exchange: exchange || undefined,
      notes: notes || undefined,
    });

    // Reset form
    setTokenSymbol('');
    setTokenName('');
    setQuantity('');
    setPurchasePrice('');
    setPurchaseDate(undefined);
    setExchange('');
    setNotes('');
    onClose();
  };

  const handleTokenSelect = (symbol: string, name: string) => {
    setTokenSymbol(symbol.toUpperCase());
    setTokenName(name);
    setSearchQuery('');
    setShowTokenResults(false);
  };

  const handleSymbolChange = (value: string) => {
    setTokenSymbol(value.toUpperCase());
    setSearchQuery(value);
    setShowTokenResults(value.length >= 2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Token to Spot Wallet</DialogTitle>
          <DialogDescription>
            Add a cryptocurrency to track in your spot wallet
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <Select onValueChange={(value) => {
              const token = POPULAR_TOKENS.find(t => t.symbol === value);
              if (token) handleTokenSelect(token.symbol, token.name);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select popular token" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {POPULAR_TOKENS.map(token => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                placeholder="BTC"
                value={tokenSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                onFocus={() => setShowTokenResults(searchQuery.length >= 2)}
                required
              />
              {showTokenResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  ) : tokenResults.length > 0 ? (
                    <div className="py-1">
                      {tokenResults.map((token) => (
                        <button
                          key={token.id}
                          type="button"
                          onClick={() => handleTokenSelect(token.symbol, token.name)}
                          className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                        >
                          <img src={token.thumb} alt={token.name} className="w-5 h-5 rounded-full" />
                          <span className="font-medium">{token.symbol.toUpperCase()}</span>
                          <span className="text-muted-foreground text-sm">- {token.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No tokens found. You can add it manually.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Token Name *</Label>
              <Input
                id="name"
                placeholder="Bitcoin"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="text"
                inputMode="decimal"
                placeholder="0.5"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isValidDecimal(value)) {
                    setQuantity(value);
                  }
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Purchase Price</Label>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                placeholder="40000"
                value={purchasePrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isValidDecimal(value)) {
                    setPurchasePrice(value);
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !purchaseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {purchaseDate ? format(purchaseDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={purchaseDate}
                    onSelect={setPurchaseDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exchange">Exchange</Label>
              <Popover open={openExchange} onOpenChange={setOpenExchange}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openExchange}
                    className="w-full justify-between"
                  >
                    {exchange || "Select exchange"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                  <Command>
                    <CommandInput placeholder="Search exchanges..." />
                    <CommandList>
                      <CommandEmpty>No exchange found.</CommandEmpty>
                      <CommandGroup>
                        {EXCHANGES.map((ex) => (
                          <CommandItem
                            key={ex}
                            value={ex}
                            onSelect={(currentValue) => {
                              setExchange(currentValue === exchange.toLowerCase() ? "" : ex);
                              setOpenExchange(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                exchange === ex ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {ex}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this holding..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Token</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
