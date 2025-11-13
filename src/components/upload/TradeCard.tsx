import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Trash2, Copy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { StrategyTagSelector } from './StrategyTagSelector';
import { MistakeTagSelector } from './MistakeTagSelector';
import { EmotionTagSelector } from './EmotionTagSelector';

interface Trade {
  symbol?: string;
  symbol_temp?: string;
  side?: 'long' | 'short';
  entry_price?: number;
  exit_price?: number;
  position_size?: number;
  profit_loss?: number;
  roi_percent?: number;
  opened_at?: string;
  closed_at?: string;
  setup?: string;
  error_tags?: string[];
  emotion_tags?: string[];
  notes?: string;
  broker?: string;
  leverage?: number;
  funding_fee?: number;
  trading_fee?: number;
  [key: string]: any;
}

interface DuplicateInfo {
  isDuplicate: boolean;
  matchedTrade?: any;
  matchScore?: number;
}

interface TradeCardProps {
  trade: Trade;
  index: number;
  isApproved: boolean;
  isDeleted?: boolean;
  isDuplicate?: boolean;
  duplicateInfo?: DuplicateInfo;
  onTradeChange: (field: string, value: any) => void;
  onApprove: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRestore?: () => void;
  sessionStrategies?: Set<string>;
  sessionMistakes?: Set<string>;
  onNewStrategyCreated?: (strategy: string) => void;
  onNewMistakeCreated?: (mistake: string) => void;
}

export function TradeCard({
  trade,
  index,
  isApproved,
  isDeleted = false,
  isDuplicate = false,
  duplicateInfo,
  onTradeChange,
  onApprove,
  onDelete,
  onDuplicate,
  onRestore,
  sessionStrategies,
  sessionMistakes,
  onNewStrategyCreated,
  onNewMistakeCreated,
}: TradeCardProps) {
  const [localTrade, setLocalTrade] = useState(trade);
  const debouncedTrade = useDebounce(localTrade, 300);

  // Sync debounced changes to parent
  useEffect(() => {
    Object.keys(debouncedTrade).forEach(key => {
      if (debouncedTrade[key] !== trade[key]) {
        onTradeChange(key, debouncedTrade[key]);
      }
    });
  }, [debouncedTrade]);

  const handleLocalChange = (field: string, value: any) => {
    setLocalTrade(prev => ({ ...prev, [field]: value }));
  };

  const symbol = trade.symbol || trade.symbol_temp || 'UNKNOWN';
  const hasRequiredFields = symbol && symbol !== 'UNKNOWN' && trade.side && 
    trade.entry_price && trade.exit_price && trade.opened_at && trade.closed_at;
  
  const status = isDuplicate ? 'duplicate' : isApproved ? 'approved' : hasRequiredFields ? 'ready' : 'needs_fields';

  const formatDateTime = (date?: string) => {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 16);
  };

  // If deleted or duplicate, show only minimized header
  if (isDeleted || isDuplicate) {
    const isDuplicateStyle = isDuplicate && !isDeleted;
    return (
      <Card 
        className={cn(
          "border-[#1E242C] bg-[#12161C]/50 overflow-hidden transition-all",
          isDuplicateStyle ? "border-amber-500/30 opacity-70" : "opacity-60"
        )}
        style={{ backgroundColor: '#12161C' }}
      >
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-semibold text-[#A6B1BB] shrink-0">#{index + 1}</span>
            
            {isDuplicate && (
              <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-400 shrink-0">
                Duplicate
              </Badge>
            )}
            
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-[#A6B1BB] shrink-0">
                {trade.opened_at ? new Date(trade.opened_at).toLocaleDateString() : 'No date'}
              </span>
              {trade.opened_at && (
                <span className="text-xs text-[#A6B1BB]">
                  {new Date(trade.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <span className="text-sm font-medium text-[#A6B1BB] truncate">
              {symbol}
            </span>
            
            {isDuplicate && duplicateInfo?.matchedTrade && (
              <span className="text-xs text-amber-400/70">
                · Already recorded on {new Date(duplicateInfo.matchedTrade.opened_at || duplicateInfo.matchedTrade.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestore}
            className="text-xs text-[#A6B1BB] hover:text-white shrink-0"
          >
            {isDuplicate ? 'Keep Anyway' : 'Restore'}
          </Button>
        </div>
      </Card>
     );
  }

  return (
    <Card 
      className="border-[#1E242C] bg-[#12161C] overflow-hidden transition-all hover:border-[#2A3038]"
      style={{ backgroundColor: '#12161C' }}
    >
      {/* Compact Header Row */}
      <div className="px-6 py-4 border-b border-[#1E242C] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm font-semibold text-[#A6B1BB] shrink-0">#{index + 1}</span>
          
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-[#A6B1BB] shrink-0">
              {trade.opened_at ? new Date(trade.opened_at).toLocaleDateString() : 'No date'}
            </span>
            {trade.opened_at && (
              <span className="text-xs text-[#A6B1BB]">
                {new Date(trade.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <span className="text-base font-bold text-[#EAEFF4] truncate">{symbol}</span>
          
          <Badge 
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0",
              trade.side === 'long' 
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            )}
          >
            {trade.side || 'N/A'}
          </Badge>

          <div className="flex items-center gap-4 ml-auto shrink-0">
            <div className="text-right">
              <div className="text-xs text-[#A6B1BB]">P&L</div>
              <div className={cn(
                "text-sm font-bold",
                (trade.profit_loss || 0) >= 0 ? "text-green-400" : "text-red-400"
              )}>
                ${trade.profit_loss?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#A6B1BB]">ROI</div>
              <div className={cn(
                "text-sm font-bold",
                (trade.roi_percent || 0) >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {trade.roi_percent?.toFixed(2) || '0.00'}%
              </div>
            </div>
            <Badge 
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                status === 'approved' && "bg-green-500/20 text-green-400",
                status === 'ready' && "bg-gray-500/20 text-gray-400",
                status === 'needs_fields' && "bg-amber-500/20 text-amber-400"
              )}
            >
              {status === 'approved' && 'Approved'}
              {status === 'ready' && 'Ready'}
              {status === 'needs_fields' && 'Needs fields'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Two-Column Form */}
      <div className="p-6 grid grid-cols-2 gap-6">
        {/* Left Column - Prices & Size */}
        <div className="space-y-4">
          <div>
            <Label htmlFor={`entry-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Entry Price *
            </Label>
            <Input
              id={`entry-${index}`}
              type="number"
              step="0.01"
              value={localTrade.entry_price || ''}
              onChange={(e) => handleLocalChange('entry_price', parseFloat(e.target.value) || null)}
              placeholder="0.00"
              className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11"
            />
          </div>

          <div>
            <Label htmlFor={`exit-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Exit Price *
            </Label>
            <Input
              id={`exit-${index}`}
              type="number"
              step="0.01"
              value={localTrade.exit_price || ''}
              onChange={(e) => handleLocalChange('exit_price', parseFloat(e.target.value) || null)}
              placeholder="0.00"
              className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11"
            />
          </div>

          <div>
            <Label htmlFor={`size-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Position Size
            </Label>
            <Input
              id={`size-${index}`}
              type="number"
              step="0.01"
              value={localTrade.position_size || ''}
              onChange={(e) => handleLocalChange('position_size', parseFloat(e.target.value) || null)}
              placeholder="0.00"
              className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11"
            />
          </div>

          <div>
            <Label htmlFor={`fees-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Trading Fees
            </Label>
            <Input
              id={`fees-${index}`}
              type="number"
              step="0.01"
              value={localTrade.trading_fee || ''}
              onChange={(e) => handleLocalChange('trading_fee', parseFloat(e.target.value) || null)}
              placeholder="0.00"
              className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11"
            />
          </div>

          <div>
            <Label htmlFor={`leverage-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Leverage
            </Label>
            <Input
              id={`leverage-${index}`}
              type="number"
              step="1"
              value={localTrade.leverage || ''}
              onChange={(e) => handleLocalChange('leverage', parseInt(e.target.value) || null)}
              placeholder="1x"
              className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11"
            />
          </div>
        </div>

        {/* Right Column - Timing & Meta */}
        <div className="space-y-4">
          <div>
            <Label htmlFor={`opened-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Opened At *
            </Label>
            <div className="relative">
              <Input
                id={`opened-${index}`}
                type="datetime-local"
                value={formatDateTime(localTrade.opened_at)}
                onChange={(e) => handleLocalChange('opened_at', e.target.value)}
                className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11 pr-10"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6B1BB] pointer-events-none" />
            </div>
          </div>

          <div>
            <Label htmlFor={`closed-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Closed At *
            </Label>
            <div className="relative">
              <Input
                id={`closed-${index}`}
                type="datetime-local"
                value={formatDateTime(localTrade.closed_at)}
                onChange={(e) => handleLocalChange('closed_at', e.target.value)}
                className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11 pr-10"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6B1BB] pointer-events-none" />
            </div>
          </div>

          <div>
            <Label htmlFor={`broker-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Broker
            </Label>
            <Input
              id={`broker-${index}`}
              value={localTrade.broker || ''}
              onChange={(e) => handleLocalChange('broker', e.target.value)}
              placeholder="e.g., Binance, Bybit"
              className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11"
            />
          </div>

          <div>
            <Label htmlFor={`symbol-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Symbol *
            </Label>
            <Input
              id={`symbol-${index}`}
              value={localTrade.symbol || localTrade.symbol_temp || ''}
              onChange={(e) => handleLocalChange('symbol', e.target.value)}
              placeholder="e.g., BTCUSDT"
              className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11"
            />
          </div>

          <div>
            <Label htmlFor={`side-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Side *
            </Label>
            <Select
              value={localTrade.side || ''}
              onValueChange={(value) => handleLocalChange('side', value)}
            >
              <SelectTrigger 
                id={`side-${index}`}
                className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11"
              >
                <SelectValue placeholder="Select side" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1F28] border-[#2A3038]">
                <SelectItem value="long" className="text-[#EAEFF4]">Long</SelectItem>
                <SelectItem value="short" className="text-[#EAEFF4]">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Full Width - Strategy, Mistakes, Emotions & Notes */}
        <div className="col-span-2 space-y-4">
          <StrategyTagSelector
            selectedStrategies={localTrade.setup ? [localTrade.setup] : []}
            onChange={(strategies) => handleLocalChange('setup', strategies[0] || null)}
            sessionStrategies={sessionStrategies}
            onNewStrategyCreated={onNewStrategyCreated}
          />

          <MistakeTagSelector
            selectedMistakes={localTrade.error_tags || []}
            onChange={(mistakes) => handleLocalChange('error_tags', mistakes)}
            sessionMistakes={sessionMistakes}
            onNewMistakeCreated={onNewMistakeCreated}
          />

          <EmotionTagSelector
            selectedEmotions={localTrade.emotion_tags || []}
            onChange={(emotions) => handleLocalChange('emotion_tags', emotions)}
          />

          <div>
            <Label htmlFor={`notes-${index}`} className="text-xs text-[#A6B1BB] mb-1.5 block">
              Notes
            </Label>
            <Textarea
              id={`notes-${index}`}
              value={localTrade.notes || ''}
              onChange={(e) => handleLocalChange('notes', e.target.value)}
              placeholder="Add any additional notes about this trade..."
              className="bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl min-h-[80px] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 border-t border-[#1E242C] flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
            className="rounded-xl border-[#2A3038] text-[#EAEFF4] hover:bg-[#1A1F28]"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="rounded-xl border-[#2A3038] text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
        
        <Button
          onClick={onApprove}
          disabled={!hasRequiredFields}
          className={cn(
            "rounded-xl",
            isApproved 
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {isApproved ? 'Approved' : 'Approve'}
        </Button>
      </div>
    </Card>
  );
}
