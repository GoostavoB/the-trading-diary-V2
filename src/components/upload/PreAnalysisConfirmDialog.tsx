import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Image, Plus, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PreAnalysisConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageCount: number;
  creditsRequired: number;
  currentBalance: number;
  onConfirm: () => void;
  onPurchaseCredits: () => void;
  isAnalyzing: boolean;
  broker: string;
  onBrokerChange: (broker: string) => void;
}

export const PreAnalysisConfirmDialog = ({
  open,
  onOpenChange,
  imageCount,
  creditsRequired,
  currentBalance,
  onConfirm,
  onPurchaseCredits,
  isAnalyzing,
  broker,
  onBrokerChange,
}: PreAnalysisConfirmDialogProps) => {
  const hasEnoughCredits = currentBalance >= creditsRequired;
  const [brokerError, setBrokerError] = useState(false);
  const [showAddBroker, setShowAddBroker] = useState(false);
  const [newBrokerName, setNewBrokerName] = useState('');
  const queryClient = useQueryClient();

  // Fetch custom brokers from database
  const { data: customBrokers = [] } = useQuery({
    queryKey: ['custom-brokers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_broker_preferences')
        .select('broker_name')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      
      // Get unique broker names
      const uniqueBrokers = [...new Set(data.map(b => b.broker_name))];
      return uniqueBrokers;
    },
  });

  const addCustomBroker = useMutation({
    mutationFn: async (brokerName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('user_broker_preferences')
        .insert({
          user_id: user.id,
          broker_name: brokerName,
          usage_count: 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-brokers'] });
    },
  });

  const predefinedBrokers = [
    "Binance", "Bybit", "OKX", "Bitget", "HTX", "KuCoin", 
    "Gate.io", "MEXC", "BingX", "Kraken", "Coinbase", "Bitfinex"
  ];

  const allBrokers = [...predefinedBrokers, ...customBrokers.filter(b => !predefinedBrokers.includes(b))];

  const handleAddCustomBroker = async () => {
    const trimmed = newBrokerName.trim();
    if (!trimmed) return;

    if (trimmed.length > 50) {
      toast.error("Broker name must be 50 characters or less");
      return;
    }

    try {
      await addCustomBroker.mutateAsync(trimmed);
      onBrokerChange(trimmed);
      setNewBrokerName('');
      setShowAddBroker(false);
      toast.success(`"${trimmed}" added to your brokers`);
    } catch (error) {
      console.error("Error adding broker:", error);
      toast.error("Failed to add broker");
    }
  };

  const handleConfirm = () => {
    if (!broker) {
      setBrokerError(true);
      toast.error("Please select a broker before proceeding");
      return;
    }
    setBrokerError(false);
    onConfirm();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Confirm Image Analysis</DialogTitle>
                <DialogDescription className="text-sm">
                  AI-powered trade extraction
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Broker Selection - Required */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="broker-select" className="text-sm font-medium">
                  Broker/Exchange <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={broker} 
                  onValueChange={(value) => {
                    onBrokerChange(value);
                    setBrokerError(false);
                  }}
                >
                  <SelectTrigger 
                    id="broker-select"
                    className={`h-11 ${brokerError ? 'border-destructive focus:ring-destructive' : ''}`}
                  >
                    <SelectValue placeholder="Select your broker" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {allBrokers.map((brokerName) => (
                      <SelectItem key={brokerName} value={brokerName}>
                        {brokerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {brokerError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Please select a broker before proceeding
                  </p>
                )}
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddBroker(true)}
                className="w-full h-9 text-sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Custom Broker
              </Button>
              
              <p className="text-xs text-muted-foreground leading-relaxed">
                This broker will be automatically applied to all detected trades
              </p>
            </div>

            {/* Info Box */}
            <div className="p-3.5 bg-accent/50 border border-border rounded-lg">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Processing limits:</span> Up to 10 trades per image • 15 images/minute • 150 images/hour • Large batches will be queued automatically
              </p>
            </div>

            {/* Analysis Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 px-4 bg-accent/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Images to analyze</span>
                </div>
                <span className="text-2xl font-bold tabular-nums">{imageCount}</span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credits required</span>
                  <span className="font-semibold tabular-nums">{creditsRequired}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost per upload</span>
                  <span className="font-semibold tabular-nums">1 credit</span>
                </div>

                <div className="h-px bg-border my-2" />

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Your current balance</span>
                  <span className={`text-2xl font-bold tabular-nums ${
                    hasEnoughCredits ? 'text-green-600 dark:text-green-500' : 'text-destructive'
                  }`}>
                    {currentBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Insufficient Credits Alert */}
            {!hasEnoughCredits && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-destructive">Insufficient Credits</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You need <span className="font-semibold">{creditsRequired - currentBalance}</span> more credit{creditsRequired - currentBalance !== 1 ? 's' : ''} to proceed. Purchase additional credits to continue.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4">
            {!hasEnoughCredits && (
              <Button
                onClick={onPurchaseCredits}
                variant="default"
                size="lg"
                className="w-full"
              >
                Purchase Credits
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              disabled={!hasEnoughCredits || isAnalyzing}
              variant={hasEnoughCredits ? 'default' : 'secondary'}
              size="lg"
              className="w-full"
            >
              {isAnalyzing ? 'Analyzing...' : 'Proceed with Analysis'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Custom Broker Dialog */}
      <Dialog open={showAddBroker} onOpenChange={setShowAddBroker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Broker</DialogTitle>
            <DialogDescription>
              Enter the name of your broker or exchange
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="broker-name">Broker Name</Label>
              <Input
                id="broker-name"
                placeholder="e.g., My Broker"
                value={newBrokerName}
                onChange={(e) => setNewBrokerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomBroker()}
                maxLength={50}
                className="h-11"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddBroker(false);
                setNewBrokerName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCustomBroker}
              disabled={!newBrokerName.trim()}
            >
              Add Broker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
