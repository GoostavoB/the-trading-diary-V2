import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  strategy?: string;
  notes?: string;
  broker?: string;
  [key: string]: any;
}

interface TradeReviewEditorProps {
  trades: Trade[];
  maxSelectableTrades: number;
  creditsRequired: number;
  imagesProcessed: number;
  onSave: (trades: Trade[]) => void;
  onCancel: () => void;
}

export function TradeReviewEditor({
  trades,
  maxSelectableTrades,
  creditsRequired,
  imagesProcessed,
  onSave,
  onCancel,
}: TradeReviewEditorProps) {
  const [editedTrades, setEditedTrades] = useState<Trade[]>(trades.slice(0, maxSelectableTrades));
  const [expandedTrades, setExpandedTrades] = useState<Set<number>>(new Set([0])); // First trade expanded by default

  const handleTradeChange = (index: number, field: string, value: any) => {
    const newTrades = [...editedTrades];
    newTrades[index] = { ...newTrades[index], [field]: value };
    setEditedTrades(newTrades);
  };

  const handleRemoveTrade = (index: number) => {
    const newTrades = editedTrades.filter((_, idx) => idx !== index);
    setEditedTrades(newTrades);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedTrades);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTrades(newExpanded);
  };

  const handleSave = () => {
    onSave(editedTrades);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Review & Edit Trades</h2>
              <p className="text-sm text-muted-foreground mt-1">
                AI extracted {trades.length} trades • Review and edit before saving
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Images processed:</span>
              <span className="text-sm font-semibold">{imagesProcessed}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Trades found:</span>
              <span className="text-sm font-semibold">{trades.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Selected:</span>
              <span className="text-sm font-semibold">{editedTrades.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="text-xs text-muted-foreground">Cost:</span>
              <span className="text-sm font-semibold text-primary">{creditsRequired} credits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trade List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {editedTrades.map((trade, index) => {
              const isExpanded = expandedTrades.has(index);
              const symbol = trade.symbol || trade.symbol_temp || 'UNKNOWN';
              
              return (
                <Card key={index} className="overflow-hidden">
                  {/* Trade Header - Always Visible */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleExpanded(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">#{index + 1}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-5 gap-4 flex-1">
                          <div>
                            <p className="text-xs text-muted-foreground">Symbol</p>
                            <p className="font-semibold">{symbol}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Side</p>
                            <p className={cn(
                              "font-semibold capitalize",
                              trade.side === 'long' ? 'text-green-500' : 'text-red-500'
                            )}>
                              {trade.side || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">P&L</p>
                            <p className={cn(
                              "font-semibold",
                              (trade.profit_loss || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                            )}>
                              ${trade.profit_loss?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Entry</p>
                            <p className="font-medium">${trade.entry_price?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Exit</p>
                            <p className="font-medium">${trade.exit_price?.toFixed(2) || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTrade(index);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Trade Details - Expanded */}
                  {isExpanded && (
                    <div className="border-t p-6 bg-muted/20">
                      <div className="grid grid-cols-3 gap-6">
                        {/* Column 1: Basic Info */}
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`symbol-${index}`}>Symbol *</Label>
                            <Input
                              id={`symbol-${index}`}
                              value={symbol}
                              onChange={(e) => handleTradeChange(index, 'symbol', e.target.value)}
                              placeholder="e.g., BTCUSDT"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`side-${index}`}>Position Type *</Label>
                            <Select
                              value={trade.side || ''}
                              onValueChange={(value) => handleTradeChange(index, 'side', value)}
                            >
                              <SelectTrigger id={`side-${index}`}>
                                <SelectValue placeholder="Select side" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="long">Long</SelectItem>
                                <SelectItem value="short">Short</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`broker-${index}`}>Broker</Label>
                            <Input
                              id={`broker-${index}`}
                              value={trade.broker || ''}
                              onChange={(e) => handleTradeChange(index, 'broker', e.target.value)}
                              placeholder="e.g., BingX"
                            />
                          </div>
                        </div>

                        {/* Column 2: Prices & Size */}
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`entry-${index}`}>Entry Price</Label>
                            <Input
                              id={`entry-${index}`}
                              type="number"
                              step="0.01"
                              value={trade.entry_price || ''}
                              onChange={(e) => handleTradeChange(index, 'entry_price', parseFloat(e.target.value))}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`exit-${index}`}>Exit Price</Label>
                            <Input
                              id={`exit-${index}`}
                              type="number"
                              step="0.01"
                              value={trade.exit_price || ''}
                              onChange={(e) => handleTradeChange(index, 'exit_price', parseFloat(e.target.value))}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`size-${index}`}>Position Size</Label>
                            <Input
                              id={`size-${index}`}
                              type="number"
                              step="0.01"
                              value={trade.position_size || ''}
                              onChange={(e) => handleTradeChange(index, 'position_size', parseFloat(e.target.value))}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {/* Column 3: Results & Dates */}
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`pl-${index}`}>Profit/Loss ($)</Label>
                            <Input
                              id={`pl-${index}`}
                              type="number"
                              step="0.01"
                              value={trade.profit_loss || ''}
                              onChange={(e) => handleTradeChange(index, 'profit_loss', parseFloat(e.target.value))}
                              placeholder="0.00"
                              className={cn(
                                (trade.profit_loss || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                              )}
                            />
                          </div>

                          <div>
                            <Label htmlFor={`roi-${index}`}>ROI (%)</Label>
                            <Input
                              id={`roi-${index}`}
                              type="number"
                              step="0.01"
                              value={trade.roi_percent || ''}
                              onChange={(e) => handleTradeChange(index, 'roi_percent', parseFloat(e.target.value))}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`opened-${index}`}>Opened At</Label>
                            <Input
                              id={`opened-${index}`}
                              type="datetime-local"
                              value={trade.opened_at ? new Date(trade.opened_at).toISOString().slice(0, 16) : ''}
                              onChange={(e) => handleTradeChange(index, 'opened_at', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Full Width: Strategy & Notes */}
                        <div className="col-span-3 space-y-4">
                          <div>
                            <Label htmlFor={`strategy-${index}`}>Strategy</Label>
                            <Input
                              id={`strategy-${index}`}
                              value={trade.strategy || ''}
                              onChange={(e) => handleTradeChange(index, 'strategy', e.target.value)}
                              placeholder="e.g., Breakout, Scalping, Swing..."
                            />
                          </div>

                          <div>
                            <Label htmlFor={`notes-${index}`}>Notes</Label>
                            <textarea
                              id={`notes-${index}`}
                              value={trade.notes || ''}
                              onChange={(e) => handleTradeChange(index, 'notes', e.target.value)}
                              placeholder="Add any additional notes about this trade..."
                              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {editedTrades.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No trades to save. Please go back and select trades.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {editedTrades.length} of {maxSelectableTrades} trades selected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Expand each trade to review and edit all fields
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={editedTrades.length === 0}
                className="min-w-[180px]"
              >
                <Save className="mr-2 h-4 w-4" />
                Save {editedTrades.length} {editedTrades.length === 1 ? 'Trade' : 'Trades'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
