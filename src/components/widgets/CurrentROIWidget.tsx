import { memo, useState } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CurrentROIWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  currentROI: number;
  initialInvestment: number;
  currentBalance: number;
  onInitialInvestmentUpdate?: (newValue: number) => void;
}

export const CurrentROIWidget = memo(({
  id,
  isEditMode,
  onRemove,
  currentROI,
  initialInvestment,
  currentBalance,
  onInitialInvestmentUpdate,
}: CurrentROIWidgetProps) => {
  const { user } = useAuth();
  const isPositive = currentROI >= 0;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [capitalValue, setCapitalValue] = useState(initialInvestment.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const newValue = parseFloat(capitalValue);
    
    if (isNaN(newValue) || newValue < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to update initial capital');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ initial_investment: newValue })
        .eq('user_id', user.id);

      if (error) throw error;

      if (onInitialInvestmentUpdate) {
        onInitialInvestmentUpdate(newValue);
      }
      
      toast.success('Initial capital updated successfully!');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating initial investment:', error);
      toast.error('Failed to update initial capital');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WidgetWrapper
      id={id}
      title="Current ROI"
      isEditMode={isEditMode}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <AnimatedCounter
            value={Math.abs(currentROI)}
            className={`text-3xl font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}
            suffix="%"
            prefix={isPositive ? '' : '-'}
          />
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-profit" />
          ) : (
            <TrendingDown className="h-5 w-5 text-loss" />
          )}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Initial capital</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatCurrency(initialInvestment)}</span>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setCapitalValue(initialInvestment.toString())}
                  >
                    <Edit2 className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Set Initial Capital</DialogTitle>
                    <DialogDescription>
                      Enter your starting capital to calculate accurate ROI. This should be the amount you started trading with.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="capital">Initial Capital ($)</Label>
                      <Input
                        id="capital"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1000.00"
                        value={capitalValue}
                        onChange={(e) => setCapitalValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isSaving) {
                            handleSave();
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current balance: {formatCurrency(currentBalance)}
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current capital</span>
            <span className="font-medium">{formatCurrency(currentBalance)}</span>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
});

CurrentROIWidget.displayName = 'CurrentROIWidget';
