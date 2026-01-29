import { PremiumCard } from '@/components/ui/PremiumCard';
import { ErrorReflectionWidget } from '@/components/trade-station/ErrorReflectionWidget';
import { useIsMobile } from '@/hooks/use-mobile';

export function ErrorsContent() {
  const isMobile = useIsMobile();

  return (
    <div 
      className="h-full"
      style={{
        height: isMobile ? 'auto' : 'calc(100vh - 220px)',
        overflow: isMobile ? 'visible' : 'hidden',
      }}
    >
      <PremiumCard className="h-full p-4 md:p-6">
        <ErrorReflectionWidget 
          id="errors-tab-reflection" 
          fullPage 
        />
      </PremiumCard>
    </div>
  );
}
