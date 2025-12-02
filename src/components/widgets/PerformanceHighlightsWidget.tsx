import { memo, useState } from 'react';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PerformanceItem {
    label: string;
    value: string;
}

interface PerformanceHighlightsWidgetProps extends WidgetProps {
    workingItems: PerformanceItem[];
    improvementItems: PerformanceItem[];
    insight?: string;
}

/**
 * L Widget (2×2) - Large analytics
 * Updated to 3-column matrix layout for better space efficiency
 */
export const PerformanceHighlightsWidget = memo(({
    id,
    isEditMode,
    onRemove,
    workingItems,
    improvementItems,
    insight,
}: PerformanceHighlightsWidgetProps) => {
    const { t } = useTranslation();
    const [period, setPeriod] = useState('30d');

    return (
        <div className="flex flex-col h-full">
            {/* Header: Title + Filter */}
            <div className="flex items-center justify-between p-3 border-b border-white/5">
                <h3 className="text-base font-semibold">Performance Highlights</h3>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7d</SelectItem>
                        <SelectItem value="30d">Last 30d</SelectItem>
                        <SelectItem value="90d">Last 90d</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="p-3 flex flex-col flex-1">
                {/* 3-column grid layout */}
                <div className="grid grid-cols-3 gap-4 flex-1">
                    {/* Column 1: What's Working (Top Items) */}
                    <div className="border-r border-border/50 pr-3">
                        <h4 className="text-sm font-medium mb-2 text-profit">What's Working</h4>
                        <ul className="space-y-1.5">
                            {workingItems.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="text-sm">
                                    {item.label} · <span className="text-profit font-medium">{item.value}</span>
                                </li>
                            ))}
                        </ul>
                        {workingItems.length === 0 && (
                            <p className="text-xs text-muted-foreground">Not enough data yet</p>
                        )}
                    </div>

                    {/* Column 2: Areas to Improve */}
                    <div className="border-r border-border/50 pr-3">
                        <h4 className="text-sm font-medium mb-2 text-amber-600">Areas to Improve</h4>
                        <ul className="space-y-1.5">
                            {improvementItems.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="text-sm">
                                    {item.label} · <span className="text-loss font-medium">{item.value}</span>
                                </li>
                            ))}
                        </ul>
                        {improvementItems.length === 0 && (
                            <p className="text-xs text-muted-foreground">Not enough data yet</p>
                        )}
                    </div>

                    {/* Column 3: Additional Highlights */}
                    <div>
                        <h4 className="text-sm font-medium mb-2 text-primary">Key Metrics</h4>
                        <ul className="space-y-1.5">
                            {workingItems.slice(3, 6).length > 0 ? (
                                workingItems.slice(3, 6).map((item, idx) => (
                                    <li key={idx} className="text-sm">
                                        {item.label} · <span className="font-medium">{item.value}</span>
                                    </li>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground">Additional insights</p>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Insight (optional) */}
                {insight && (
                    <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        {insight}
                    </div>
                )}
            </div>
        </div>
    );
});

PerformanceHighlightsWidget.displayName = 'PerformanceHighlightsWidget';
