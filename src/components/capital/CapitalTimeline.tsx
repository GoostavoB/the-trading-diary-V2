import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Card } from '@/components/ui/card';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'deposit' | 'withdrawal' | 'trade';
  amount: number;
  totalAfter: number;
  notes?: string;
  symbol?: string;
}

export function CapitalTimeline() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['capital-timeline', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch deposits
      const { data: deposits } = await supabase
        .from('capital_log')
        .select('*')
        .eq('user_id', user.id);

      // Fetch withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawal_log')
        .select('*')
        .eq('user_id', user.id);

      // Fetch trades (showing P&L impact)
      const { data: trades } = await supabase
        .from('trades')
        .select('closed_at, profit_loss, symbol')
        .eq('user_id', user.id)
        .not('closed_at', 'is', null);

      const timeline: TimelineEvent[] = [];

      // Add deposits
      deposits?.forEach(d => {
        timeline.push({
          id: d.id,
          date: d.log_date,
          type: 'deposit',
          amount: Number(d.amount_added),
          totalAfter: Number(d.total_after),
          notes: d.notes,
        });
      });

      // Add withdrawals
      withdrawals?.forEach(w => {
        timeline.push({
          id: w.id,
          date: w.withdrawal_date,
          type: 'withdrawal',
          amount: Number(w.amount_withdrawn),
          totalAfter: Number(w.total_after),
          notes: w.notes,
        });
      });

      // Add trades (group by day)
      const tradesByDay = new Map<string, { total: number; trades: any[] }>();
      trades?.forEach(t => {
        if (t.closed_at) {
          const dateKey = format(new Date(t.closed_at), 'yyyy-MM-dd');
          if (!tradesByDay.has(dateKey)) {
            tradesByDay.set(dateKey, { total: 0, trades: [] });
          }
          const day = tradesByDay.get(dateKey)!;
          day.total += Number(t.profit_loss || 0);
          day.trades.push(t);
        }
      });

      tradesByDay.forEach((value, dateKey) => {
        timeline.push({
          id: `trade-${dateKey}`,
          date: dateKey,
          type: 'trade',
          amount: value.total,
          totalAfter: 0, // We don't track running total for trades in timeline
          notes: `${value.trades.length} trade${value.trades.length > 1 ? 's' : ''} closed`,
          symbol: value.trades.map(t => t.symbol).join(', '),
        });
      });

      // Sort by date descending
      return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading timeline...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No capital activity yet. Start by adding a deposit.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Capital Activity Timeline</h3>
      <div className="relative space-y-3">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        {events.map((event, index) => {
          const isDeposit = event.type === 'deposit';
          const isWithdrawal = event.type === 'withdrawal';
          const isTrade = event.type === 'trade';
          
          const Icon = isDeposit ? TrendingUp : isWithdrawal ? TrendingDown : DollarSign;
          const iconColor = isDeposit 
            ? 'text-emerald-500 bg-emerald-500/10' 
            : isWithdrawal 
            ? 'text-rose-500 bg-rose-500/10'
            : event.amount >= 0
            ? 'text-emerald-500 bg-emerald-500/10'
            : 'text-rose-500 bg-rose-500/10';
          
          const amountColor = isDeposit 
            ? 'text-emerald-500' 
            : isWithdrawal 
            ? 'text-rose-500'
            : event.amount >= 0
            ? 'text-emerald-500'
            : 'text-rose-500';

          return (
            <Card key={event.id} className="relative pl-14 pr-4 py-3">
              {/* Icon */}
              <div className={`absolute left-3 top-3 p-2 rounded-full ${iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">
                      {event.type === 'trade' ? 'Trading P&L' : event.type}
                    </span>
                    {isTrade && event.symbol && (
                      <span className="text-xs text-muted-foreground">
                        ({event.symbol})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(event.date), 'MMMM dd, yyyy')}
                  </div>
                  {event.notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {event.notes}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${amountColor}`}>
                    {isDeposit ? '+' : isWithdrawal ? '-' : event.amount >= 0 ? '+' : ''}
                    {formatCurrency(Math.abs(event.amount))}
                  </div>
                  {!isTrade && (
                    <div className="text-xs text-muted-foreground">
                      Balance: {formatCurrency(event.totalAfter)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
