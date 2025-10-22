import { memo } from 'react';
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface QuickActionCardProps {
  className?: string;
}

export const QuickActionCard = memo(({ className }: QuickActionCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actions = [
    {
      icon: Plus,
      label: t('widgets.newTrade'),
      onClick: () => navigate('/upload'),
      variant: "default" as const
    },
    {
      icon: Upload,
      label: t('widgets.importCSV'),
      onClick: () => navigate('/upload'),
      variant: "outline" as const
    },
    {
      icon: BarChart3,
      label: t('widgets.viewAnalytics'),
      onClick: () => navigate('/analytics'),
      variant: "ghost" as const
    }
  ];

  return (
    <GlassCard className={className} role="article" aria-labelledby="quick-actions-title">
      <div className="space-y-4 p-6 md:p-8">
        <h3 id="quick-actions-title" className="text-lg font-semibold">{t('widgets.quickActions')}</h3>
        
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
