import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings2, Save, X, RotateCcw, Eye, EyeOff, LayoutDashboard, Columns } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WidgetConfig } from '@/hooks/useDashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomizeDashboardControlsProps {
  isCustomizing: boolean;
  hasChanges: boolean;
  onStartCustomize: () => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  widgets?: WidgetConfig[];
  onToggleWidget?: (widgetId: string) => void;
  columnCount?: number;
  onColumnCountChange?: (count: number) => void;
  widgetCount?: number;
}

const widgetLabels: Record<string, string> = {
  totalBalance: 'Total Balance',
  stats: 'Statistics Overview',
  portfolio: 'Portfolio Overview',
  topMovers: 'Top Movers',
  quickActions: 'Quick Actions',
  recentTransactions: 'Recent Transactions',
  premiumCTA: 'Premium Upgrade',
  insights: 'Performance Insights',
  streaks: 'Trading Streaks',
  heatmap: 'Trading Heatmap',
  charts: 'Performance Charts',
};

export function CustomizeDashboardControls({
  isCustomizing,
  hasChanges,
  onStartCustomize,
  onSave,
  onCancel,
  onReset,
  widgets = [],
  onToggleWidget,
  columnCount = 3,
  onColumnCountChange,
  widgetCount = 0,
}: CustomizeDashboardControlsProps) {
  const visibleCount = widgetCount || widgets.filter(w => w.visible).length;
  const hiddenCount = widgets.filter(w => !w.visible).length;

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
            Customize Dashboard
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
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
                    Customize Mode
                    <Badge variant="secondary" className="text-xs">
                      {visibleCount} visible
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Drag widgets to rearrange, toggle visibility, or resize them
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onReset}
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-destructive/10 hover:text-destructive"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  onClick={onSave}
                  disabled={!hasChanges}
                  size="sm"
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Layout
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
                      Hidden Widgets
                      <Badge variant="outline" className="text-xs">
                        {hiddenCount}
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Click to show these widgets again
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
