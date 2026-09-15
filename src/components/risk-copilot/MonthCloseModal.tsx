import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMonthlyMedals } from '@/hooks/useMonthlyMedals';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MEDAL_EMOJI: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };
const MEDAL_LABEL: Record<string, string> = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

export function MonthCloseModal() {
  const { pendingClose, closeMonth } = useMonthlyMedals();
  const { formatAmount } = useCurrency();
  const [reinvestPct, setReinvestPct] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  if (!pendingClose) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await closeMonth(reinvestPct);
      toast.success('Monthly cycle closed');
    } catch {
      toast.error('Failed to close the monthly cycle');
    } finally {
      setSubmitting(false);
    }
  };

  const profit = pendingClose.profit;
  const reinvestAmount = profit > 0 ? profit * (reinvestPct / 100) : 0;
  const withdrawAmount = profit > 0 ? profit - reinvestAmount : 0;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Cycle Close — {format(pendingClose.month, 'MMMM yyyy')}</DialogTitle>
          <DialogDescription>
            Review this month's result before moving on to the next cycle.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {pendingClose.medal ? (
            <div className="rounded-xl border border-border bg-muted/20 p-5 text-center space-y-1">
              <div className="text-4xl">{MEDAL_EMOJI[pendingClose.medal]}</div>
              <div className="text-sm font-bold">{MEDAL_LABEL[pendingClose.medal]} Medal</div>
              <div className="text-xs text-muted-foreground font-mono">
                {pendingClose.pct.toFixed(0)}% of goal ({formatAmount(pendingClose.profit)} / {formatAmount(pendingClose.goal)})
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/20 p-5 text-center space-y-1">
              <div className="text-sm font-bold text-muted-foreground">Goal not reached this month</div>
              <div className="text-xs text-muted-foreground font-mono">
                {formatAmount(pendingClose.profit)} / {formatAmount(pendingClose.goal)} ({pendingClose.pct.toFixed(0)}%)
              </div>
            </div>
          )}
          {profit > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                What do you want to do with this month's profit ({formatAmount(profit)})?
              </div>
              <Slider value={[reinvestPct]} onValueChange={(v) => setReinvestPct(v[0])} min={0} max={100} step={5} />
              <div className="flex justify-between text-xs font-mono">
                <span className="text-apple-green">Reinvest: {formatAmount(reinvestAmount)} ({reinvestPct}%)</span>
                <span className="text-apple-orange">Withdraw: {formatAmount(withdrawAmount)} ({100 - reinvestPct}%)</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={handleConfirm} disabled={submitting}>
            Confirm and Start New Cycle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
