import { lazy, Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

// Lazy load the Long Short Ratio page content
const LongShortRatioContent = lazy(() => import('@/pages/LongShortRatio'));

export function LSRContent() {
    return (
        <div 
            className="animate-in fade-in-50 duration-500 flex flex-col gap-3"
            style={{
                height: 'calc(100vh - 220px)',
            }}
        >
            {/* Warning Banner */}
            <div className="shrink-0 glass rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-sm font-medium text-amber-200">
                    Avoid shorting BTC and Altcoins when Long Short Ratio is below 1.
                </p>
            </div>

            {/* LSR Charts */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <Suspense fallback={<DashboardSkeleton />}>
                    <LongShortRatioContent />
                </Suspense>
            </div>
        </div>
    );
}
