import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { X, TrendingUp, TrendingDown, Plus, Check, ChevronsUpDown } from "lucide-react";
import { ExtractedTrade } from "@/types/trade";
import { BrokerSelect } from "./BrokerSelect";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CSVPreviewWithEditProps {
  trades: ExtractedTrade[];
  onTradesUpdate: (updatedTrades: ExtractedTrade[]) => void;
  broker?: string; // Pre-selected broker from analysis
}

export const CSVPreviewWithEdit = ({ trades, onTradesUpdate, broker }: CSVPreviewWithEditProps) => {
  const [openSetup, setOpenSetup] = useState<number | null>(null);
  const [setupSearches, setSetupSearches] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();

  // Fetch user setups
  const { data: userSetups = [] } = useQuery({
    queryKey: ['user-setups'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_setups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Create setup mutation
  const createSetup = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('user_setups')
        .insert({ user_id: user.id, name: name.trim() })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-setups'] });
    },
  });

  const handleCreateSetup = async (setupName: string): Promise<any> => {
    try {
      const newSetup = await createSetup.mutateAsync(setupName);
      toast.success(`Setup "${setupName}" created`);
      return newSetup;
    } catch (error) {
      console.error('Error creating setup:', error);
      toast.error('Failed to create setup');
      return null;
    }
  };

  const handleFieldUpdate = (index: number, field: keyof ExtractedTrade, value: any) => {
    const updatedTrades = [...trades];
    (updatedTrades[index] as any)[field] = value;
    onTradesUpdate(updatedTrades);
  };

  const handleRemoveTrade = (index: number) => {
    const updatedTrades = trades.filter((_, i) => i !== index);
    onTradesUpdate(updatedTrades);
    toast.success('Trade removed');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review & Edit Trades</h3>
          <p className="text-sm text-muted-foreground">
            Verify all fields before importing • All fields are editable
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {trades.length} trade{trades.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {trades.map((trade, index) => {
          const profitLoss = trade.profit_loss || 0;
          const isProfit = profitLoss >= 0;

          return (
            <Card key={index} className="p-4 glass-subtle space-y-4 relative">
              {/* Header with profit/loss indicator */}
              <div className="mb-3 pb-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-sm">Trade #{index + 1}</h4>
                  <Badge
                    variant={isProfit ? "default" : "destructive"}
                    className={cn(
                      "gap-1.5 font-medium",
                      isProfit
                        ? "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                        : "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20"
                    )}
                  >
                    {isProfit ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {isProfit ? "Profit" : "Loss"}: ${Math.abs(profitLoss).toFixed(2)}
                  </Badge>
                </div>
                <Button
                  onClick={() => handleRemoveTrade(index)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Symbol */}
                <div>
                  <Label className="text-xs text-muted-foreground">Symbol *</Label>
                  <Input
                    value={trade.symbol || ''}
                    onChange={(e) => handleFieldUpdate(index, 'symbol', e.target.value)}
                    className="mt-1 h-8 text-sm"
                    placeholder="BTCUSDT"
                  />
                </div>

                {/* Position Type */}
                <div>
                  <Label className="text-xs text-muted-foreground">Position Type *</Label>
                  <Select
                    value={trade.side || 'long'}
                    onValueChange={(value) => handleFieldUpdate(index, 'side', value as 'long' | 'short')}
                  >
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Entry Price */}
                <div>
                  <Label className="text-xs text-muted-foreground">Entry Price *</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={trade.entry_price || ''}
                    onChange={(e) => handleFieldUpdate(index, 'entry_price', parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                {/* Exit Price */}
                <div>
                  <Label className="text-xs text-muted-foreground">Exit Price *</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={trade.exit_price || ''}
                    onChange={(e) => handleFieldUpdate(index, 'exit_price', parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                {/* Position Size */}
                <div>
                  <Label className="text-xs text-muted-foreground">Size *</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={trade.position_size || ''}
                    onChange={(e) => handleFieldUpdate(index, 'position_size', parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                {/* Leverage */}
                <div>
                  <Label className="text-xs text-muted-foreground">Leverage</Label>
                  <Input
                    type="number"
                    step="1"
                    value={trade.leverage || ''}
                    onChange={(e) => handleFieldUpdate(index, 'leverage', parseFloat(e.target.value) || 1)}
                    className="mt-1 h-8 text-sm"
                    placeholder="1"
                  />
                </div>

                {/* P&L */}
                <div>
                  <Label className="text-xs text-muted-foreground">P&L *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={trade.profit_loss || ''}
                    onChange={(e) => handleFieldUpdate(index, 'profit_loss', parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                {/* ROI % */}
                <div>
                  <Label className="text-xs text-muted-foreground">ROI %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={trade.roi || ''}
                    onChange={(e) => handleFieldUpdate(index, 'roi', parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                {/* Funding Fee */}
                <div>
                  <Label className="text-xs text-muted-foreground">Funding Fee</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={trade.funding_fee || ''}
                    onChange={(e) => handleFieldUpdate(index, 'funding_fee', parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                    placeholder="0"
                  />
                </div>

                {/* Trading Fee */}
                <div>
                  <Label className="text-xs text-muted-foreground">Trading Fee</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={trade.trading_fee || ''}
                    onChange={(e) => handleFieldUpdate(index, 'trading_fee', parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                    placeholder="0"
                  />
                </div>

                {/* Period of Day */}
                <div>
                  <Label className="text-xs text-muted-foreground">Period of Day</Label>
                  <Select
                    value={trade.period_of_day || 'morning'}
                    onValueChange={(value) => handleFieldUpdate(index, 'period_of_day', value as 'morning' | 'afternoon' | 'night')}
                  >
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Margin */}
                <div>
                  <Label className="text-xs text-muted-foreground">Margin</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={trade.margin || ''}
                    onChange={(e) => handleFieldUpdate(index, 'margin', parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Broker, Setup, Emotional Tag, Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Broker */}
                <div>
                  <Label className="text-xs text-muted-foreground">Broker</Label>
                  <div className="mt-1">
                    <BrokerSelect
                      value={trade.broker || broker || ''}
                      onChange={(value) => handleFieldUpdate(index, 'broker', value)}
                      required={false}
                    />
                  </div>
                </div>

                {/* Setup */}
                <div>
                  <Label className="text-xs text-muted-foreground">Setup</Label>
                  <Popover open={openSetup === index} onOpenChange={(open) => setOpenSetup(open ? index : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSetup === index}
                        className="w-full justify-between mt-1 h-8 text-sm"
                      >
                        {trade.setup || "Select or create setup..."}
                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search or type new setup..."
                          value={setupSearches[index] || ''}
                          onValueChange={(value) => setSetupSearches(prev => ({ ...prev, [index]: value }))}
                        />
                        <CommandList>
                          <CommandEmpty>Type to create your first setup.</CommandEmpty>
                          {setupSearches[index] && !userSetups.some(s => s.name.toLowerCase() === setupSearches[index].toLowerCase()) && (
                            <CommandGroup heading="Create New">
                              <CommandItem
                                onSelect={async () => {
                                  const newSetup = await handleCreateSetup(setupSearches[index]);
                                  if (newSetup) {
                                    handleFieldUpdate(index, 'setup', newSetup.name);
                                  }
                                  setSetupSearches(prev => ({ ...prev, [index]: '' }));
                                  setOpenSetup(null);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add "{setupSearches[index]}"
                              </CommandItem>
                            </CommandGroup>
                          )}
                          {userSetups.filter(setup =>
                            !setupSearches[index] ||
                            setup.name.toLowerCase().includes(setupSearches[index].toLowerCase())
                          ).length > 0 && (
                            <CommandGroup heading="Existing Setups">
                              {userSetups
                                .filter(setup =>
                                  !setupSearches[index] ||
                                  setup.name.toLowerCase().includes(setupSearches[index].toLowerCase())
                                )
                                .map((setup) => (
                                  <CommandItem
                                    key={setup.id}
                                    value={setup.name}
                                    onSelect={() => {
                                      handleFieldUpdate(index, 'setup', setup.name);
                                      setSetupSearches(prev => ({ ...prev, [index]: '' }));
                                      setOpenSetup(null);
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
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Emotional Tag */}
                <div>
                  <Label className="text-xs text-muted-foreground">Emotional Tag</Label>
                  {trade.emotional_tag ? (
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="h-8 text-sm">
                        {trade.emotional_tag}
                        <X
                          className="ml-2 h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleFieldUpdate(index, 'emotional_tag', '')}
                        />
                      </Badge>
                    </div>
                  ) : (
                    <Input
                      placeholder="Type and press Enter..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          handleFieldUpdate(index, 'emotional_tag', e.currentTarget.value.trim());
                          e.currentTarget.value = '';
                        }
                      }}
                      className="mt-1 h-8 text-sm"
                    />
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <Input
                    placeholder="Trade observations..."
                    value={trade.notes || ''}
                    onChange={(e) => handleFieldUpdate(index, 'notes', e.target.value)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {trades.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No trades to display</p>
        </Card>
      )}
    </div>
  );
};
