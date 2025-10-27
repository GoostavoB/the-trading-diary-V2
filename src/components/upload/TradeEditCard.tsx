import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { BrokerSelect } from './BrokerSelect';
import { ExtractedTrade } from '@/types/trade';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TradeEditCardProps {
  trade: ExtractedTrade;
  index: number;
  onUpdate: (index: number, field: keyof ExtractedTrade, value: any) => void;
  onRemove: (index: number) => void;
  userSetups?: { id: string; name: string }[];
  onCreateSetup?: (name: string) => Promise<any>;
}

export const TradeEditCard = ({ 
  trade, 
  index, 
  onUpdate, 
  onRemove,
  userSetups = [],
  onCreateSetup
}: TradeEditCardProps) => {
  const [setupOpen, setSetupOpen] = React.useState(false);
  const [setupSearch, setSetupSearch] = React.useState('');

  // Ensure period_of_day has a valid default value
  React.useEffect(() => {
    if (!trade.period_of_day || !['morning', 'afternoon', 'night'].includes(trade.period_of_day)) {
      onUpdate(index, 'period_of_day', 'morning');
    }
  }, []);

  const handleCreateSetup = async () => {
    if (!setupSearch.trim() || !onCreateSetup) return;
    const newSetup = await onCreateSetup(setupSearch.trim());
    if (newSetup) {
      onUpdate(index, 'setup', newSetup.name);
      setSetupOpen(false);
      setSetupSearch('');
    }
  };

  const filteredSetups = userSetups.filter(s =>
    s.name.toLowerCase().includes(setupSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-muted/20 rounded-lg border relative">
      {/* Remove button - top right */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Trade Number Header - spans full width */}
      <div className="col-span-full mb-2">
        <h4 className="text-lg font-semibold">Trade #{index + 1} - Review & Edit</h4>
      </div>

      {/* Symbol */}
      <div>
        <Label>Symbol</Label>
        <Input
          value={trade.symbol}
          onChange={(e) => onUpdate(index, 'symbol', e.target.value)}
          placeholder="e.g. BTCUSDT"
        />
      </div>

      {/* Position Type (Side) */}
      <div>
        <Label>Position Type</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={trade.side === 'long' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onUpdate(index, 'side', 'long')}
          >
            Long
          </Button>
          <Button
            type="button"
            variant={trade.side === 'short' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onUpdate(index, 'side', 'short')}
          >
            Short
          </Button>
        </div>
      </div>

      {/* Entry Price */}
      <div>
        <Label>Entry Price</Label>
        <Input
          type="number"
          step="any"
          value={trade.entry_price}
          onChange={(e) => onUpdate(index, 'entry_price', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Exit Price */}
      <div>
        <Label>Exit Price</Label>
        <Input
          type="number"
          step="any"
          value={trade.exit_price}
          onChange={(e) => onUpdate(index, 'exit_price', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Position Size */}
      <div>
        <Label>Position Size</Label>
        <Input
          type="number"
          step="any"
          value={trade.position_size}
          onChange={(e) => onUpdate(index, 'position_size', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Leverage */}
      <div>
        <Label>Leverage</Label>
        <Input
          type="number"
          step="any"
          value={trade.leverage}
          onChange={(e) => onUpdate(index, 'leverage', parseFloat(e.target.value) || 1)}
        />
      </div>

      {/* P&L */}
      <div>
        <Label>P&L</Label>
        <Input
          type="number"
          step="any"
          value={trade.profit_loss}
          onChange={(e) => onUpdate(index, 'profit_loss', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* ROI % */}
      <div>
        <Label>ROI %</Label>
        <Input
          type="number"
          step="any"
          value={trade.roi}
          onChange={(e) => onUpdate(index, 'roi', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Funding Fee */}
      <div>
        <Label>Funding Fee</Label>
        <Input
          type="number"
          step="any"
          value={trade.funding_fee}
          onChange={(e) => onUpdate(index, 'funding_fee', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Trading Fee */}
      <div>
        <Label>Trading Fee</Label>
        <Input
          type="number"
          step="any"
          value={trade.trading_fee}
          onChange={(e) => onUpdate(index, 'trading_fee', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Period of Day */}
      <div>
        <Label>Period of Day</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={trade.period_of_day === 'morning' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onUpdate(index, 'period_of_day', 'morning')}
          >
            Morning
          </Button>
          <Button
            type="button"
            variant={trade.period_of_day === 'afternoon' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onUpdate(index, 'period_of_day', 'afternoon')}
          >
            Afternoon
          </Button>
          <Button
            type="button"
            variant={trade.period_of_day === 'night' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onUpdate(index, 'period_of_day', 'night')}
          >
            Night
          </Button>
        </div>
      </div>

      {/* Margin */}
      <div>
        <Label>Margin</Label>
        <Input
          type="number"
          step="any"
          value={trade.margin}
          onChange={(e) => onUpdate(index, 'margin', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Broker */}
      <div>
        <Label>Broker</Label>
        <BrokerSelect
          value={trade.broker || ''}
          onChange={(value) => onUpdate(index, 'broker', value)}
          required={false}
        />
      </div>

      {/* Setup/Strategy */}
      <div>
        <Label>Setup / Strategy</Label>
        <Popover open={setupOpen} onOpenChange={setSetupOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={setupOpen}
              className="w-full justify-between"
            >
              {trade.setup || "Select or create setup..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput
                placeholder="Search or create setup..."
                value={setupSearch}
                onValueChange={setSetupSearch}
              />
              <CommandList>
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-2 p-4">
                    <p className="text-sm text-muted-foreground">No setup found</p>
                    {setupSearch.trim() && (
                      <Button
                        size="sm"
                        onClick={handleCreateSetup}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create "{setupSearch.trim()}"
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredSetups.map((setup) => (
                    <CommandItem
                      key={setup.id}
                      value={setup.name}
                      onSelect={() => {
                        onUpdate(index, 'setup', setup.name);
                        setSetupOpen(false);
                        setSetupSearch('');
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          trade.setup === setup.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {setup.name}
                    </CommandItem>
                  ))}
                  {setupSearch.trim() && !filteredSetups.some(s => s.name.toLowerCase() === setupSearch.toLowerCase()) && (
                    <CommandItem
                      value={setupSearch}
                      onSelect={handleCreateSetup}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{setupSearch.trim()}"
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Emotional Tag */}
      <div>
        <Label>Emotional Tag</Label>
        <Input
          value={trade.emotional_tag || ''}
          onChange={(e) => onUpdate(index, 'emotional_tag', e.target.value)}
          placeholder="e.g. confident, anxious"
        />
      </div>

      {/* Opened At */}
      <div>
        <Label>Opened At</Label>
        <Input
          type="datetime-local"
          value={trade.opened_at ? trade.opened_at.slice(0, 16) : ''}
          onChange={(e) => onUpdate(index, 'opened_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
        />
      </div>

      {/* Closed At */}
      <div>
        <Label>Closed At</Label>
        <Input
          type="datetime-local"
          value={trade.closed_at ? trade.closed_at.slice(0, 16) : ''}
          onChange={(e) => onUpdate(index, 'closed_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
        />
      </div>

      {/* Notes - spans full width */}
      <div className="col-span-full">
        <Label>Notes</Label>
        <Textarea
          value={trade.notes || ''}
          onChange={(e) => onUpdate(index, 'notes', e.target.value)}
          placeholder="Add any additional notes about this trade..."
          rows={3}
        />
      </div>
    </div>
  );
};
