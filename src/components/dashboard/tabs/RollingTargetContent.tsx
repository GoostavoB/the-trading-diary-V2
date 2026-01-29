import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { RollingTargetWidget } from '@/components/widgets/RollingTargetWidget';

export function RollingTargetContent() {
    const { processedTrades, initialInvestment } = useDashboard();

    return (
        <div 
            className="animate-in fade-in-50 duration-500"
            style={{
                height: 'calc(100vh - 220px)',
            }}
        >
            <RollingTargetWidget 
                id="rollingTarget" 
                trades={processedTrades}
                initialInvestment={initialInvestment}
            />
        </div>
    );
}
