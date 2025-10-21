import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EfficiencyBadgeProps {
  score: number;
}

export const EfficiencyBadge = memo(({ score }: EfficiencyBadgeProps) => {
  const getColor = (score: number) => {
    if (score >= 9) return 'bg-green-500/20 text-green-500 border-green-500/30';
    if (score >= 7) return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
    if (score >= 5) return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
    if (score >= 3) return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
    return 'bg-red-500/20 text-red-500 border-red-500/30';
  };
  
  const getLabel = (score: number) => {
    if (score >= 9) return 'Super Low';
    if (score >= 7) return 'Very Low';
    if (score >= 5) return 'OK/Fair';
    if (score >= 3) return 'High';
    return 'Abusive';
  };
  
  return (
    <Badge className={cn("border font-mono", getColor(score))}>
      {score.toFixed(1)}/10 • {getLabel(score)}
    </Badge>
  );
});

EfficiencyBadge.displayName = 'EfficiencyBadge';
