import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { useRiskCalculator } from '@/hooks/useRiskCalculator';
import { useDailyLossLock } from '@/hooks/useDailyLossLock';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useCurrency } from '@/contexts/CurrencyContext';

export const DailyLossLockStatus = () => {
  const { calculation } = useRiskCalculator();
  const { isLocked, todaysPnL, remaining, overrideUntil, loading, override } = useDailyLossLock(calculation.dailyLossLimit);
  const { settings, updateSetting } = useUserSettings();
  const { formatAmount } = useCurrency();

  const percentUsed = calculation.dailyLossLimit > 0
    ? Math.min(100, Math.abs((todaysPnL / calculation.dailyLossLimit) * 100))
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Loss Lock</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (isLocked && !overrideUntil) {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-600" />
            <CardTitle>Daily Loss Limit Hit</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-950/20">
            <p className="text-sm text-red-600">
              You've reached your daily loss limit of {formatAmount(calculation.dailyLossLimit)}. Trading is paused.
            </p>
          </div>
          <Button onClick={override} variant="outline" className="w-full">
            <Unlock className="h-4 w-4 mr-2" />
            Override for 60 minutes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Loss Lock</CardTitle>
          <Switch
            checked={settings.daily_loss_lock_enabled}
            onCheckedChange={(checked) => updateSetting('daily_loss_lock_enabled', checked)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
};
