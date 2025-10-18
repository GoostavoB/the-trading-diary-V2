import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings2, Save, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomizeDashboardControlsProps {
  isCustomizing: boolean;
  hasChanges: boolean;
  onStartCustomize: () => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function CustomizeDashboardControls({
  isCustomizing,
  hasChanges,
  onStartCustomize,
  onSave,
  onCancel,
  onReset,
}: CustomizeDashboardControlsProps) {
  return (
    <AnimatePresence mode="wait">
      {!isCustomizing ? (
        <motion.div
          key="start"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Button
            onClick={onStartCustomize}
            variant="outline"
            className="gap-2"
          >
            <Settings2 className="w-4 h-4" />
            Customize Dashboard
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="controls"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card className="p-4 bg-accent/10 border-accent">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="font-semibold text-sm">Customize Mode</h3>
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
                  className="gap-2"
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
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Save className="w-4 h-4" />
                  Save Layout
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
