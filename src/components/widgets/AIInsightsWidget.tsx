import { memo } from 'react';
import { WidgetProps } from '@/types/widget';
import { Trade } from '@/types/trade';
import { Sparkles, Info } from 'lucide-react';

interface AIInsightsWidgetProps extends WidgetProps {
  trades: Trade[];
}

export const AIInsightsWidget = memo(({
  trades,
}: AIInsightsWidgetProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">AI Insights</h3>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3 rounded-full bg-muted/50 mb-3">
          <Info className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">Coming Soon</p>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          AI-powered trade analysis and personalized insights will be available in a future update.
        </p>
      </div>
    </div>
  );
});

AIInsightsWidget.displayName = 'AIInsightsWidget';
