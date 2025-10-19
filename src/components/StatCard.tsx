import { memo } from 'react';
import { GlassCard } from "@/components/ui/glass-card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ExplainMetricButton } from "@/components/ExplainMetricButton";
import { useAIAssistant } from '@/contexts/AIAssistantContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  className?: string;
  valueClassName?: string;
}

export const StatCard = memo(({
  title,
  value,
  icon: Icon,
  trend,
  sparklineData,
  className,
  valueClassName,
}: StatCardProps) => {
  const { openWithPrompt } = useAIAssistant();
  const chartData = sparklineData?.map((val, idx) => ({ value: val, index: idx })) || [];
  
  return (
    <GlassCard hover className={cn("p-5", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2">
            <ExplainMetricButton 
              metricName={title}
              metricValue={value}
              onExplain={openWithPrompt}
            />
            {Icon && (
              <div className="p-2 rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            valueClassName
          )}>
            {value}
          </p>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg",
              trend.isPositive
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary"
            )}>
              <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
            </div>
          )}
        </div>
        
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-3 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </GlassCard>
  );
});

StatCard.displayName = 'StatCard';
