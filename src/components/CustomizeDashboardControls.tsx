import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { Settings2, Save, X, RotateCcw, Eye, EyeOff, LayoutDashboard, Columns, Plus, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WidgetConfig } from '@/hooks/useDashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TourButton } from '@/components/tour/TourButton';
import { useUserTier } from '@/hooks/useUserTier';

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
  columnCount?: number;
  onColumnCountChange?: (count: number) => void;
  widgetCount?: number;
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
  columnCount = 3,
  onColumnCountChange,
  widgetCount = 0,
}: CustomizeDashboardControlsProps) {
  const { t } = useTranslation();
  const { canCustomizeDashboard } = useUserTier();
  const visibleCount = widgetCount || widgets.filter(w => w.visible).length;
  const hiddenCount = widgets.filter(w => !w.visible).length;

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
            onClick={onStartCustomize}
            variant="outline"
            className="gap-2 glass hover:glass-strong"
          >
            <LayoutDashboard className="w-4 h-4" />
            {t('dashboard.customizeLayout')}
            {!canCustomizeDashboard && (
              <Crown className="w-3 h-3 text-amber-500 ml-1" />
            )}
          </Button>
          
          {/* Column Count Selector */}
          {onColumnCountChange && (
            <div className="flex items-center gap-2">
              <Columns className="w-4 h-4 text-muted-foreground" />
              <Select
                value={columnCount.toString()}
                onValueChange={(value) => onColumnCountChange(parseInt(value, 10))}
              >
                <SelectTrigger className="w-[120px] glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('dashboard.columns.one')}</SelectItem>
                  <SelectItem value="2">{t('dashboard.columns.two')}</SelectItem>
                  <SelectItem value="3">{t('dashboard.columns.three')}</SelectItem>
                  <SelectItem value="4">{t('dashboard.columns.four')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Tour Button */}
          <TourButton />
        </motion.div>
      ) : (
        <motion.div
          key="controls"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          <Card className="p-4 glass-strong border-primary/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Settings2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    {t('dashboard.editMode')}
                    <Badge variant="secondary" className="text-xs">
                      {t('dashboard.visibleCount', { count: visibleCount })}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.dragInstructions')}
                  </p>
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
          </Card>

          {/* Widget Visibility Panel */}
          {hiddenCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-4 glass border-muted-foreground/20">
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
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}