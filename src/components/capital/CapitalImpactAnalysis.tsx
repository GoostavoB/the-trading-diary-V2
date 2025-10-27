import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface CapitalImpactAnalysisProps {
  totalDeposits: number;
  totalWithdrawals: number;
  tradingPnL: number;
  currentBalance: number;
}

export function CapitalImpactAnalysis({
  totalDeposits,
  totalWithdrawals,
  tradingPnL,
  currentBalance,
}: CapitalImpactAnalysisProps) {
  const profitBeforeWithdrawals = tradingPnL;
  const netCapital = totalDeposits - totalWithdrawals;
  const effectiveROI = totalDeposits > 0 ? (tradingPnL / totalDeposits) * 100 : 0;
  const withdrawalRate = totalDeposits > 0 ? (totalWithdrawals / totalDeposits) * 100 : 0;
  const capitalEfficiency = currentBalance / (totalDeposits || 1); // How much of your capital is still working

  // Determine status
  const getStatus = () => {
    if (withdrawalRate > 80) {
      return {
        icon: AlertTriangle,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        message: 'High withdrawal rate - consider capital preservation',
      };
    }
    if (effectiveROI > 10) {
      return {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        message: 'Strong performance - capital is growing efficiently',
      };
    }
    return {
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      message: 'Balanced capital management',
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${status.bg}`}>
            <StatusIcon className={`h-5 w-5 ${status.color}`} />
          </div>
          <div>
            <h3 className="font-semibold">Capital Impact Analysis</h3>
            <p className="text-sm text-muted-foreground">{status.message}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Trading Performance */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trading P&L</span>
              <span className={tradingPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                <BlurredCurrency amount={tradingPnL} className="inline" />
              </span>
            </div>
            <Progress 
              value={Math.min(Math.abs(effectiveROI), 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {effectiveROI.toFixed(1)}% ROI on deposited capital
            </p>
          </div>

          {/* Withdrawal Impact */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Withdrawal Rate</span>
              <span className={withdrawalRate > 50 ? 'text-amber-500' : 'text-muted-foreground'}>
                {withdrawalRate.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(withdrawalRate, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              <BlurredCurrency amount={totalWithdrawals} className="inline" /> withdrawn of <BlurredCurrency amount={totalDeposits} className="inline" /> deposited
            </p>
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid gap-3 md:grid-cols-3 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Net Capital</p>
            <p className="text-lg font-semibold">
              <BlurredCurrency amount={netCapital} />
            </p>
            <p className="text-xs text-muted-foreground">
              Deposits - Withdrawals
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Profit Before Withdrawals</p>
            <p className={`text-lg font-semibold ${profitBeforeWithdrawals >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              <BlurredCurrency amount={profitBeforeWithdrawals} />
            </p>
            <p className="text-xs text-muted-foreground">
              Pure trading performance
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Capital Efficiency</p>
            <p className="text-lg font-semibold">
              {(capitalEfficiency * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Capital still active
            </p>
          </div>
        </div>

        {/* Recommendation */}
        {withdrawalRate > 70 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <strong>Tip:</strong> Your withdrawal rate is high. Consider keeping more capital 
              in your account to compound returns and maintain trading flexibility.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
