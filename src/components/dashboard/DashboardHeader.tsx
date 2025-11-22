import { Button } from '@/components/ui/button';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { CustomizeDashboardControls } from '@/components/CustomizeDashboardControls';
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
}: DashboardHeaderProps) => {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    Overview of your trading performance
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
                    hasChanges={false} // You might want to pass this as a prop too if needed
                    onStartCustomize={onStartCustomize}
                    onSave={onSaveLayout}
                    onCancel={onCancelCustomize}
                    onReset={onResetLayout}
                />
            </div>
        </div>
    );
};
