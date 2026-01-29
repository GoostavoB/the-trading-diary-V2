import { memo, useState } from 'react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { TrendingUp, TrendingDown, Edit2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [capitalValue, setCapitalValue] = useState(initialInvestment.toString());
  const [isSaving, setIsSaving] = useState(false);

  // Check if there's existing capital log entries
  const checkExistingCapitalLog = async (): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase
      .from('capital_log')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    return !error && data && data.length > 0;
  };

  const handleSaveClick = async () => {
    const newValue = parseFloat(capitalValue);

    if (isNaN(newValue) || newValue < 0) {
      toast.error(t('errors.validationError'));
      return;
    }

    // Check if there's existing capital history
    const hasHistory = await checkExistingCapitalLog();
    
    if (hasHistory) {
      // Show confirmation dialog
      setShowConfirmDialog(true);
    } else {
      // Proceed directly
      await executeCapitalUpdate();
    }
  };

  const executeCapitalUpdate = async () => {
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
      // Update user_settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .update({ initial_investment: newValue })
        .eq('user_id', user.id);

      if (settingsError) throw settingsError;

      // Clear existing capital_log entries and create a single entry with the new initial investment
      const { error: deleteError } = await supabase
        .from('capital_log')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Create a new capital_log entry with the initial investment
      const today = new Date().toISOString().split('T')[0];
      const { error: insertError } = await supabase
        .from('capital_log')
        .insert({
          user_id: user.id,
          log_date: today,
          amount_added: newValue,
          total_after: newValue,
          notes: 'Initial capital set'
        });

      if (insertError) throw insertError;

      if (onInitialInvestmentUpdate) {
        onInitialInvestmentUpdate(newValue);
      }

      toast.success(t('success.updated'));
      setIsDialogOpen(false);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error updating initial investment:', error);
      toast.error(t('errors.generic'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="font-semibold text-sm">{t('widgets.currentROI.title')}</h3>
      </div>
      <div className="p-4 space-y-3">
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
                            handleSaveClick();
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('widgets.currentBalance')}: <BlurredCurrency amount={currentBalance} className="inline" />
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Tip: Use <a href="/capital-management" className="text-primary hover:underline">Capital Management</a> to track capital additions over time for accurate ROI calculation.
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
                      <Button onClick={handleSaveClick} disabled={isSaving}>
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

      {/* Confirmation Dialog for Capital History Reset */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reset Capital History?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  <strong>This action will delete your entire capital management history</strong> and create a fresh starting point with the new amount.
                </p>
                <p className="text-amber-600 dark:text-amber-400">
                  All previous capital additions, removals, and tracking data will be permanently lost.
                </p>
                <p>
                  If you want to add capital without losing history, use the <a href="/capital-management" className="text-primary hover:underline font-medium">Capital Management</a> page instead.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeCapitalUpdate}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? 'Resetting...' : 'Yes, Reset History'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

CurrentROIWidget.displayName = 'CurrentROIWidget';
