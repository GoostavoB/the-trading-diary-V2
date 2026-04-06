import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { SmartWidgetWrapper } from '@/components/widgets/SmartWidgetWrapper';
import { EmotionMistakeCorrelationWidget } from '@/components/widgets/EmotionMistakeCorrelationWidget';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

export function BehaviorContent() {
  const { loading, processedTrades } = useDashboard();

  if (loading) return <DashboardSkeleton />;

  return (
    <div 
      className="animate-in fade-in-50 duration-500"
      style={{ height: 'calc(100vh - 220px)' }}
    >
      <SmartWidgetWrapper id="emotionMistakeCorrelation" hasPadding={false} className="h-full">
        <EmotionMistakeCorrelationWidget id="emotionMistakeCorrelation" trades={processedTrades} />
      </SmartWidgetWrapper>
    </div>
  );
}
