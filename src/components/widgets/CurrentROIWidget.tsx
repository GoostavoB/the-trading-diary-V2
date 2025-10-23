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
  const isPositive = currentROI >= 0;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [capitalValue, setCapitalValue] = useState(initialInvestment.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const newValue = parseFloat(capitalValue);
    
    if (isNaN(newValue) || newValue < 0) {
      toast.error(t('errors.validationError'));
      return;
    }

    if (!user) {
      toast.error(t('errors.unauthorized'));
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
      
      toast.success(t('success.updated'));
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating initial investment:', error);
      toast.error(t('errors.generic'));
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
                      <p className="text-xs text-muted-foreground">
                        {t('widgets.currentBalance')}: <BlurredCurrency amount={currentBalance} className="inline" />
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Tip: Use Capital Management in Settings → Trading to track capital additions over time for accurate ROI calculation.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSaving}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? t('settings.saving') : t('common.save')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('widgets.currentCapital')}</span>
            <span className="font-medium">
              <BlurredCurrency amount={currentBalance} className="inline" />
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-2">
            ROI calculation includes all capital additions tracked in Capital Management
          </p>
        </div>
      </div>
    </WidgetWrapper>
  );
});

CurrentROIWidget.displayName = 'CurrentROIWidget';
