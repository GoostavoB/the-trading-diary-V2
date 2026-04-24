import { Button } from '@/components/ui/button';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { CustomizeDashboardControls } from '@/components/CustomizeDashboardControls';
import { MarketTicker } from './MarketTicker';
import { X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface DashboardHeaderProps {
    dateRange: { from: Date | undefined; to: Date | undefined; } | undefined;
    setDateRange: (range: { from: Date | undefined; to: Date | undefined; } | undefined) => void;
    clearDateRange: () => void;
    isCustomizing: boolean;
    onStartCustomize: () => void;
    onSaveLayout: () => void;
    onCancelCustomize: () => void;
    onResetLayout: () => void;
    canCustomizeDashboard: boolean;
    showUpgradePrompt: (show: boolean) => void;
    layoutMode?: 'adaptive' | 'fixed';
    onLayoutModeChange?: (mode: 'adaptive' | 'fixed') => void;
    canUndo?: boolean;
    onUndoReset?: () => void;
    onForceReset?: () => void;
    onAddWidget?: () => void;
}

export const DashboardHeader = ({
    dateRange,
    setDateRange,
    clearDateRange,
    isCustomizing,
    onStartCustomize,
    onSaveLayout,
    onCancelCustomize,
    onResetLayout,
    canCustomizeDashboard,
    showUpgradePrompt,
    layoutMode,
    onLayoutModeChange,
    canUndo,
    onUndoReset,
    onForceReset,
    onAddWidget,
}: DashboardHeaderProps) => {
    return (
        <div className="space-y-4 mb-6">
            {/* ── Top row: title + controls ── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gradient-white">
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground/70 mt-0.5">
                        Your trading command center
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <DateRangeFilter
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                    />
                    {dateRange?.from && (
                        <Button variant="ghost" size="sm" onClick={clearDateRange}>
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                    <CustomizeDashboardControls
                        isCustomizing={isCustomizing}
                        hasChanges={false}
                        onStartCustomize={onStartCustomize}
                        onSave={onSaveLayout}
                        onCancel={onCancelCustomize}
                        onReset={onResetLayout}
                        layoutMode={layoutMode}
                        onLayoutModeChange={onLayoutModeChange}
                        canUndo={canUndo}
                        onUndoReset={onUndoReset}
                        onForceReset={onForceReset}
                        onAddWidget={onAddWidget}
                        widgets={[]}
                    />
                </div>
            </div>

            {/* ── Market ticker bar ── */}
            <div className="flex items-center px-3 py-2 rounded-lg border border-white/8 bg-black/20 backdrop-blur-sm overflow-x-auto scrollbar-none">
                <MarketTicker />
            </div>
        </div>
    );
};
