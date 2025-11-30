import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { TradeHistory } from '@/components/TradeHistory';

export function HistoryContent() {
    const { refreshData } = useDashboard();

    return (
        <div className="animate-in fade-in-50 duration-500">
            <TradeHistory onTradesChange={refreshData} />
        </div>
    );
}
