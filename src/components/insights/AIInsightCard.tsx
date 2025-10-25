import { memo } from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Insight } from '@/hooks/useHomeInsights';

interface AIInsightCardProps {
  insight: Insight;
  position: number;
}

export const AIInsightCard = memo(({ insight, position }: AIInsightCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(insight.detailUrl);
  };

  const isPersonal = insight.source === 'user-analytics';
  const confidenceColor = insight.confidence >= 75 ? 'text-success' : insight.confidence >= 50 ? 'text-warning' : 'text-muted-foreground';

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group" onClick={handleClick}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm line-clamp-1">{insight.title}</h3>
          </div>
          <Badge variant={isPersonal ? "default" : "secondary"} className="text-xs shrink-0">
            {isPersonal ? 'Personal' : 'Market'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">{insight.metric.label}</span>
            <span className="text-lg font-bold text-foreground">{insight.metric.value}</span>
            <span className="text-xs text-muted-foreground">({insight.metric.window})</span>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1">{insight.rule}</p>

          <div className="pt-1">
            <p className="text-sm font-medium text-foreground line-clamp-2">{insight.action}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className={`text-xs font-medium ${confidenceColor}`}>
            {insight.confidence}% confidence
          </span>
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 group-hover:gap-2 transition-all">
            View Details
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
});

AIInsightCard.displayName = 'AIInsightCard';
