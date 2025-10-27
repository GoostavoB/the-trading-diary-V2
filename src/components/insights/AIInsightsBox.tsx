import { memo, useState, useEffect } from 'react';
import { AIInsightCard } from './AIInsightCard';
import { LSRInsightCard } from './LSRInsightCard';
import { useHomeInsights } from '@/hooks/useHomeInsights';
import { useInsightsRotation } from '@/hooks/useInsightsRotation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface AIInsightsBoxProps {
  maxInsights?: number;
  rotationInterval?: number;
  refreshInterval?: number;
}

export const AIInsightsBox = memo(({
  maxInsights = 8,
  rotationInterval = 8000,
  refreshInterval = 60000,
}: AIInsightsBoxProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('ai-insights-collapsed');
    return saved === 'true';
  });

  const { data, isLoading, error } = useHomeInsights(refreshInterval);

  useEffect(() => {
    localStorage.setItem('ai-insights-collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const allInsights = data ? [...data.user_insights, ...data.market_insights] : [];

  const {
    visibleInsights,
    handleMouseEnter,
    handleMouseLeave,
  } = useInsightsRotation(allInsights, rotationInterval, maxInsights);

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-destructive">Failed to load insights. Please try again later.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!visibleInsights.length) {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No insights available</h3>
        <p className="text-sm text-muted-foreground">
          Market insights will appear here when data is available.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">AI Insights</h2>
        </div>
        <div className="flex items-center gap-3">
          {!isCollapsed && data && (
            <p className="text-xs text-muted-foreground">
              Updated {new Date(data.asOf).toLocaleTimeString()}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-8 w-8 p-0"
            title={isCollapsed ? "Expand insights" : "Collapse insights"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isCollapsed ? (
        <p className="text-sm text-muted-foreground">
          Click to expand and view market insights and analysis
        </p>
      ) : (
        <>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <LSRInsightCard />
            {visibleInsights.map((insight, index) => (
              <AIInsightCard
                key={`${insight.id}-${index}`}
                insight={insight}
                position={index}
              />
            ))}
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              This is not financial advice. •{' '}
              <a href="#" className="underline hover:text-foreground">
                Methodology
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
});

AIInsightsBox.displayName = 'AIInsightsBox';
