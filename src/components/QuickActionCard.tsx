import { memo } from 'react';
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionCardProps {
  className?: string;
}

export const QuickActionCard = memo(({ className }: QuickActionCardProps) => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      label: "New Trade",
      onClick: () => navigate('/upload'),
      variant: "default" as const
    },
    {
      icon: Upload,
      label: "Import CSV",
      onClick: () => navigate('/upload'),
      variant: "outline" as const
    },
    {
      icon: BarChart3,
      label: "View Analytics",
      onClick: () => navigate('/analytics'),
      variant: "ghost" as const
    }
  ];

  return (
    <GlassCard className={className} role="article" aria-labelledby="quick-actions-title">
      <div className="space-y-4">
        <h3 id="quick-actions-title" className="text-lg font-semibold">Quick Actions</h3>
        
        <div className="space-y-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant}
                className="w-full justify-start gap-2"
                size="sm"
                aria-label={action.label}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
});

QuickActionCard.displayName = 'QuickActionCard';
