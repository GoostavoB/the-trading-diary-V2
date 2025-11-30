import { memo, useState } from 'react';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TopMover {
    symbol: string;
    change: number;
    label: string;
}

interface CostEfficiencyWidgetProps extends WidgetProps {
    totalFees: number;
    feesPercentOfPnL: number;
    efficiency: string;
}

/**
 * M Widget (2×1) - Medium panel
 * Per spec: padding 10-14px, 3 KPIs side-by-side
 */
export const CostEfficiencyWidget = memo(({
    id,
    isEditMode,
    onRemove,
    totalFees,
    feesPercentOfPnL,
    efficiency,
}: CostEfficiencyWidgetProps) => {
    const { t } = useTranslation();

    return (

        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="font-semibold text-sm">Cost Efficiency</h3>
            </div>
            <div className="p-4 space-y-4">
                {/* Header with Badge */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Fee Analysis
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${efficiency === 'High'
                            ? 'bg-neon-green/10 text-neon-green border-neon-green/20'
                            : efficiency === 'Medium'
                                ? 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20'
                                : 'bg-neon-red/10 text-neon-red border-neon-red/20'
                            }`}>
                            {efficiency} Efficiency
                        </span>
                    </div>
                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                        Details →
                    </button>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Total Fees */}
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Total Fees (30d)</div>
                        <div className="text-2xl font-bold tracking-tight text-foreground">
                            ${totalFees.toFixed(2)}
                        </div>
                    </div>

                    {/* Fees % of P&L */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">Impact on P&L</div>
                            <div className={`text-xs font-bold ${feesPercentOfPnL > 10 ? 'text-neon-red' : 'text-foreground'}`}>
                                {feesPercentOfPnL.toFixed(1)}%
                            </div>
                        </div>
                        {/* Custom Progress Bar */}
                        <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden ring-1 ring-white/5">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${feesPercentOfPnL < 5 ? 'bg-neon-green shadow-[0_0_10px_rgba(34,197,94,0.4)]' :
                                    feesPercentOfPnL < 10 ? 'bg-neon-yellow' : 'bg-neon-red'
                                    }`}
                                style={{ width: `${Math.min(feesPercentOfPnL, 100)}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-muted-foreground text-right">
                            Target: &lt; 8%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

CostEfficiencyWidget.displayName = 'CostEfficiencyWidget';
