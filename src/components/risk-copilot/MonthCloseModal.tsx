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
import { useMonthlyMedals } from '@/hooks/useMonthlyMedals';
import { SurplusRolloverPanel } from './SurplusRolloverPanel';
import { percentualDoRisco, type ResultadoCiclo } from '@/lib/surplusEngine';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MEDAL_EMOJI: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };
const MEDAL_LABEL: Record<string, string> = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

export function MonthCloseModal() {
  const { pendingClose, closeMonth } = useMonthlyMedals();
  const { formatAmount } = useCurrency();
  const [rolagem, setRolagem] = useState<ResultadoCiclo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!pendingClose) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      // O que persiste hoje e a fracao do surplus autorizada ao risco. Quando a
      // tabela cycle_rollovers estiver aplicada (migracao surplus_rollover),
      // gravar tambem saldoTrade e saldoCofre para o historico do ciclo.
      const pctRisco = rolagem
        ? percentualDoRisco(Math.max(0, pendingClose.profit - pendingClose.goal), rolagem.riscoAutorizado)
        : 0;
      await closeMonth(pctRisco);
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
    /* `open` fixo em true e o componente sumindo por `return null` faz o
       Dialog ser DESMONTADO em vez de fechado. Amarrar ao pendingClose deixa
       o Radix rodar o ciclo de fechamento e devolver o body ao normal. */
    <Dialog open={!!pendingClose} onOpenChange={() => {}}>
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
            <SurplusRolloverPanel
              saldoAtual={profit}
              meta={pendingClose.goal}
              onChange={setRolagem}
            />
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
