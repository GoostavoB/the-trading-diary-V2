import { memo } from 'react';
import { GlassCard } from "@/components/ui/glass-card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { ExplainMetricButton } from "@/components/ExplainMetricButton";
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { formatCurrency } from "@/utils/formatNumber";
import { Trade } from "@/types/trade";

interface TotalBalanceCardProps {
  balance: number;
  change: number;
  changePercent: number;
  trades: Trade[];
  className?: string;
}

export const TotalBalanceCard = memo(({ 
  balance, 
  change, 
  changePercent, 
  trades,
  className 
}: TotalBalanceCardProps) => {
  const { openWithPrompt } = useAIAssistant();
  
  // Generate sparkline data from last 14 trades
  const sparklineData = trades
    .slice(-14)
    .reduce((acc, trade, index) => {
      const prevValue = index > 0 ? acc[index - 1].value : 0;
      acc.push({
        value: prevValue + (trade.pnl || 0),
        date: trade.trade_date
      });
      return acc;
    }, [] as { value: number; date: string }[]);

  const isPositive = change >= 0;

  return (
    <GlassCard hover className={className} role="article" aria-labelledby="total-balance-title">
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10" aria-hidden="true">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <p id="total-balance-title" className="text-sm font-medium text-muted-foreground">Total Balance</p>
          </div>
          <div className="flex items-center gap-2">
            <ExplainMetricButton 
              metricName="Total Balance"
              metricValue={formatCurrency(balance)}
              context={`Current change: ${formatCurrency(change)} (${changePercent.toFixed(1)}%)`}
              onExplain={openWithPrompt}
            />
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              isPositive ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
            }`}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-xs font-semibold">
                {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-4xl font-bold tracking-tight">
            <AnimatedCounter value={balance} prefix="$" decimals={2} />
          </div>
          <p className={`text-sm font-medium ${
            isPositive ? 'text-primary' : 'text-secondary'
          }`}>
            {isPositive ? '+' : ''}{formatCurrency(change)} today
          </p>
        </div>

        {/* Mini Timeline Chart */}
        {sparklineData.length > 0 && (
          <div className="h-20 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-strong px-2 py-1 rounded-lg text-xs">
                          {formatCurrency(payload[0].value as number)}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </GlassCard>
  );
});

TotalBalanceCard.displayName = 'TotalBalanceCard';
