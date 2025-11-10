import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import { useDailyLossLock } from '@/hooks/useDailyLossLock';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface DailyLossLockStatusProps {
  currentDailyPnL: number;
  dailyLossLimit: number;
}

export const DailyLossLockStatus = ({
  currentDailyPnL,
  dailyLossLimit,
}: DailyLossLockStatusProps) => {
  const {
    settings,
    isLocked,
    isOverrideActive,
    overrideLock,
    updateSettings,
    getRemainingOverrideTime,
  } = useDailyLossLock(currentDailyPnL, dailyLossLimit);

  const [showLockDialog, setShowLockDialog] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Show lock dialog when locked
  if (isLocked && !showLockDialog) {
    setShowLockDialog(true);
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isLocked ? (
              <ShieldAlert className="h-5 w-5 text-red-500" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            )}
            <h3 className="font-semibold">Daily Loss Lock</h3>
          </div>
          <Switch
            checked={settings.daily_loss_lock_enabled}
            onCheckedChange={updateSettings}
          />
        </div>

        {settings.daily_loss_lock_enabled && (
          <>
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current P&L:</span>
                <span className={currentDailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(currentDailyPnL)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Loss Limit:</span>
                <span className="font-medium">{formatCurrency(dailyLossLimit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium">
                  {formatCurrency(Math.max(0, dailyLossLimit + currentDailyPnL))}
                </span>
              </div>
            </div>

            {/* Status Indicator */}
            {isLocked && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded mb-3">
                <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Trading Locked</span>
                </div>
                <div className="text-xs text-red-600/80">
                  Daily loss limit reached. Take a break.
                </div>
              </div>
            )}

            {isOverrideActive && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded mb-3">
                <div className="flex items-center gap-2 text-orange-600 text-sm font-medium mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Override Active</span>
                </div>
                <div className="text-xs text-orange-600/80">
                  {getRemainingOverrideTime()} minutes remaining
                </div>
              </div>
            )}

            {!isLocked && !isOverrideActive && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Protected</span>
                </div>
                <div className="text-xs text-green-600/80">
                  Lock will activate at -{formatCurrency(dailyLossLimit)}
                </div>
              </div>
            )}
          </>
        )}

        {!settings.daily_loss_lock_enabled && (
          <div className="text-sm text-muted-foreground">
            Enable to protect your capital from large daily losses.
          </div>
        )}
      </Card>

      {/* Lock Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              Daily Loss Limit Reached
            </DialogTitle>
            <DialogDescription>
              You've reached your daily loss limit of {formatCurrency(dailyLossLimit)}.
              It's recommended to stop trading for today.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded">
              <div className="text-sm font-medium mb-2">Current Loss</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(Math.abs(currentDailyPnL))}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Taking a break helps prevent emotional trading and protects your capital.
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLockDialog(false);
                  overrideLock();
                }}
                className="flex-1"
              >
                Override (60 min)
              </Button>
              <Button onClick={() => setShowLockDialog(false)} className="flex-1">
                Okay, I'll Stop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
