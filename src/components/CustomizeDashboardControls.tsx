import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { useTranslation } from '@/hooks/useTranslation';
import { Settings2, Save, X, RotateCcw, Eye, EyeOff, Plus, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WidgetConfig } from '@/hooks/useDashboardLayout';
import { Badge } from '@/components/ui/badge';

interface CustomizeDashboardControlsProps {
  isCustomizing: boolean;
  hasChanges: boolean;
  onStartCustomize: () => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  onAddWidget?: () => void;
  widgets?: WidgetConfig[];
  onToggleWidget?: (widgetId: string) => void;
  // columnCount removed - grid is always fixed to 3 columns
  widgetCount?: number;
  canUndo?: boolean;
  onUndoReset?: () => void;
  onForceReset?: () => void;
  layoutMode?: 'adaptive' | 'fixed';
  onLayoutModeChange?: (mode: 'adaptive' | 'fixed') => void;
}

export function CustomizeDashboardControls({
  isCustomizing,
  hasChanges,
  onStartCustomize,
  onSave,
  onCancel,
  onReset,
  onAddWidget,
  widgets = [],
  onToggleWidget,
  // columnCount removed
  widgetCount = 0,
  canUndo = false,
  onUndoReset,
  onForceReset,
  layoutMode,
  onLayoutModeChange,
}: CustomizeDashboardControlsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const visibleCount = widgetCount || widgets.filter(w => w.visible).length;
  const hiddenCount = widgets.filter(w => !w.visible).length;

  console.log('[Controls] 🎛️ Render:', {
    isCustomizing,
    hasChanges,
    visibleCount,
    hiddenCount
  });

  const widgetLabels: Record<string, string> = {
    totalBalance: t('widgets.totalBalance.title'),
    stats: t('widgets.stats'),
    portfolio: t('widgets.portfolio'),
    topMovers: t('widgets.topMovers.title'),
    quickActions: t('widgets.quickActions.title'),
    recentTransactions: t('widgets.recentTransactions.title'),
    premiumCTA: t('widgets.premiumCTA'),
    insights: t('widgets.insights'),
    streaks: t('widgets.streaks'),
    heatmap: t('widgets.heatmap'),
    charts: t('widgets.charts'),
    longShortRatio: 'Long/Short Ratio',
  };

  return (
    <AnimatePresence mode="wait">
      {!isCustomizing ? (
        <motion.div
          key="start"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <Button
            onClick={() => navigate('/upload')}
            variant="outline"
            className="gap-2 glass hover:glass-strong"
          >
            <Plus className="w-4 h-4" />
            Add Trade
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="controls"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          <PremiumCard className="p-4 glass-strong border-primary/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Settings2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                    {t('dashboard.editMode')}
                    <Badge variant="secondary" className="text-xs">
                      {t('dashboard.visibleCount', { count: visibleCount })}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.dragInstructions')}
                  </p>

                  {/* Column selector removed - grid is always 3 columns */}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onAddWidget && (
                  <Button
                    onClick={onAddWidget}
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('dashboard.addWidget')}
                  </Button>
                )}
                <Button
                  onClick={onReset}
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-destructive/10 hover:text-destructive"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('dashboard.resetLayout')}
                </Button>
                {canUndo && onUndoReset && (
                  <Button
                    onClick={onUndoReset}
                    variant="ghost"
                    size="sm"
                    className="gap-2 hover:bg-primary/10 hover:text-primary"
                  >
                    <Undo2 className="w-4 h-4" />
                    Undo Reset
                  </Button>
                )}
                <Button
                  onClick={onCancel}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={onSave}
                  disabled={!hasChanges}
                  size="sm"
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t('dashboard.saveLayout')}
                </Button>
              </div>
            </div>
          </PremiumCard>

          {/* Widget Visibility Panel */}
          {hiddenCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <PremiumCard className="p-4 glass border-muted-foreground/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-muted">
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                      {t('dashboard.hiddenWidgets')}
                      <Badge variant="outline" className="text-xs">
                        {hiddenCount}
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {t('dashboard.clickToShow')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {widgets
                        .filter(w => !w.visible)
                        .map(widget => (
                          <Button
                            key={widget.id}
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-primary/10 hover:border-primary/50"
                            onClick={() => onToggleWidget?.(widget.id)}
                          >
                            <Eye className="w-3 h-3" />
                            {widgetLabels[widget.id] || widget.id}
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}