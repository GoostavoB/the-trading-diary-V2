import { memo, useState } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown, Edit2, Info } from 'lucide-react';
import { PinButton } from '@/components/widgets/PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

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
  const { t } = useTranslation();
  const { isPinned, togglePin } = usePinnedWidgets();
  const pinnedId = 'currentROI' as const;
  const isPositive = currentROI >= 0;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [capitalValue, setCapitalValue] = useState(initialInvestment.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !capitalValue) return;

    const newValue = parseFloat(capitalValue);
    if (isNaN(newValue) || newValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSaving(true);
    const previousValue = initialInvestment;
    const startTime = Date.now();
    const toastId = toast.loading('Updating initial capital...');

    // Optimistically update UI immediately
    onInitialInvestmentUpdate?.(newValue);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          initial_capital: newValue,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Initial capital updated', { id: toastId });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('[CurrentROIWidget] Failed to save initial capital:', error);
      
      // Revert optimistic update on error
      onInitialInvestmentUpdate?.(previousValue);
      
      toast.error('Failed to update capital', {
        id: toastId,
        description: error.message || 'Please try again'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WidgetWrapper
      id={id}
      title={t('widgets.currentROI.title')}
      isEditMode={isEditMode}
      onRemove={onRemove}
      headerActions={
        !isEditMode && (
          <PinButton
            isPinned={isPinned(pinnedId)}
            onToggle={() => togglePin(pinnedId)}
          />
        )
      }
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
            <span className="text-muted-foreground">{t('widgets.initialCapital')}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                <BlurredCurrency amount={initialInvestment} className="inline" />
              </span>
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
                    <DialogTitle>{t('widgets.setInitialCapital')}</DialogTitle>
                    <DialogDescription>
                      {t('widgets.enterStartingCapital')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="capital">{t('widgets.initialCapitalLabel')}</Label>
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
                      <p className="text-sm text-muted-foreground mb-2">
                        Current Balance: <BlurredCurrency amount={currentBalance} />
                      </p>
                      <p className="text-xs text-muted-foreground/70 mb-4">
                        Note: This updates your ROI calculations. To track deposits/withdrawals, visit Track Capital.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSaving}
                        type="button"
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving || !user}
                        type="button"
                      >
                        {isSaving ? t('settings.saving') : t('common.save')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">{t('widgets.currentCapital')}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Invested Trading Capital + Total Profit - Withdrawn Capital
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-medium">
              <BlurredCurrency amount={currentBalance} className="inline" />
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-2">
            Total profit from trading, regardless of withdrawals
          </p>
        </div>
      </div>
    </WidgetWrapper>
  );
});

CurrentROIWidget.displayName = 'CurrentROIWidget';
