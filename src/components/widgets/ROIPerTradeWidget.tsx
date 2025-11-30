import { memo } from 'react';
import { formatPercent } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ROIPerTradeWidgetProps {
    id: string;
    isEditMode?: boolean;
    onRemove?: () => void;
    avgROIPerTrade: number;
}

/**
 * S Widget (1×1) - Compact stat  
 * Consolidates "Simple Average ROI" + "Avg ROI Per Trade" per spec
 * Per spec: padding 8-10px, max 3 lines, typography 10-18px
 */
export const ROIPerTradeWidget = memo(({
    id,
    isEditMode,
    onRemove,
    avgROIPerTrade,
}: ROIPerTradeWidgetProps) => {
    const { t } = useTranslation();
    const isPositive = avgROIPerTrade >= 0;

    return (

        <div className="p-2 h-full flex flex-col justify-center">
            {/* Top: Label (10-11px) */}
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                ROI Per Trade
            </div>

            {/* Middle: Main value (16-18px bold) */}
            <div className={`text-xl font-semibold mt-1 flex items-baseline gap-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
                {formatPercent(avgROIPerTrade)}
                {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                ) : (
                    <TrendingDown className="h-3 w-3" />
                )}
            </div>

            {/* Bottom: Secondary text (10px) */}
            <div className="text-[10px] text-muted-foreground mt-0.5">
                Average return
            </div>
        </div>
    );
});

ROIPerTradeWidget.displayName = 'ROIPerTradeWidget';
