import { GlassCard } from "@/components/ui/glass-card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  valueClassName?: string;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  className,
  valueClassName,
}: StatCardProps) => {
  return (
    <GlassCard hover className={cn("p-5", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="p-2 rounded-xl bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
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
      </div>
    </GlassCard>
  );
};
