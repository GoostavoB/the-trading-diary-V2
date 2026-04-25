import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { useRiskCalculator } from '@/hooks/useRiskCalculator';
import { useDailyLossLock } from '@/hooks/useDailyLossLock';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useCurrency } from '@/contexts/CurrencyContext';
import { WidgetWrapper } from '@/components/widgets/WidgetWrapper';
import { WidgetProps } from '@/types/widget';
import { Label } from '@/components/ui/label';

type DailyLossLockStatusProps = WidgetProps

export const DailyLossLockStatus = ({
  id,
  isEditMode,
  onRemove,
  onExpand
}: DailyLossLockStatusProps) => {
  const { calculation } = useRiskCalculator();
  const { isLocked, todaysPnL, remaining, overrideUntil, loading, override } = useDailyLossLock(calculation.dailyLossLimit);
  const { settings, updateSetting } = useUserSettings();
  const { formatAmount } = useCurrency();

  const percentUsed = calculation.dailyLossLimit > 0
    ? Math.min(100, Math.abs((todaysPnL / calculation.dailyLossLimit) * 100))
    : 0;

  if (loading) {
    return (
      <WidgetWrapper
        id={id}
        title="Daily Loss Lock"
        isEditMode={isEditMode}
        onRemove={onRemove}
        onExpand={onExpand}
      >
        <p className="text-sm text-muted-foreground">Loading...</p>
      </WidgetWrapper>
    );
  }

  if (isLocked && !overrideUntil) {
    return (
      <WidgetWrapper
        id={id}
        title="Daily Loss Limit Hit"
        isEditMode={isEditMode}
        onRemove={onRemove}
        onExpand={onExpand}
        className="border-red-500"
        headerActions={
          <Lock className="h-5 w-5 text-red-600" />
        }
      >
        <div className="space-y-4">
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-950/20">
            <p className="text-sm text-red-600">
              You've reached your daily loss limit of {formatAmount(calculation.dailyLossLimit)}. Trading is paused.
            </p>
          </div>
          <Button onClick={override} variant="outline" className="w-full">
            <Unlock className="h-4 w-4 mr-2" />
            Override for 60 minutes
          </Button>
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper
      id={id}
      title="Daily Loss Lock"
      isEditMode={isEditMode}
      onRemove={onRemove}
      onExpand={onExpand}
      headerActions={
        <div className="flex items-center gap-2">
          <Label htmlFor="loss-lock-toggle" className="text-xs text-muted-foreground cursor-pointer">
            Enable
          </Label>
          <Switch
            id="loss-lock-toggle"
            checked={settings.daily_loss_lock_enabled}
            onCheckedChange={(checked) => updateSetting('daily_loss_lock_enabled', checked)}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {overrideUntil && (
          <div className="rounded-md border border-amber-500 bg-amber-50 p-3 dark:bg-amber-950/20">
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600">
                Override active until {overrideUntil.toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today's P&L</span>
            <span className={todaysPnL < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
              {formatAmount(todaysPnL)}
            </span>
          </div>
          <Progress value={percentUsed} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Limit: {formatAmount(calculation.dailyLossLimit)}</span>
            <span className="text-muted-foreground">
              Remaining: {formatAmount(remaining)} ({(100 - percentUsed).toFixed(0)}%)
            </span>
          </div>
        </div>

        {percentUsed > 75 && !isLocked && (
          <div className="rounded-md border border-amber-500 bg-amber-50 p-3 dark:bg-amber-950/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600">
                Approaching daily limit
              </span>
            </div>
          </div>
        )}

        {!settings.daily_loss_lock_enabled && (
          <p className="text-xs text-muted-foreground">
            Enable to block trading when daily loss limit is hit.
          </p>
        )}
      </div>
    </WidgetWrapper>
  );
};
