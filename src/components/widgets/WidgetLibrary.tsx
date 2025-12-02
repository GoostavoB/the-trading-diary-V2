import { memo, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Crown, Trash2 } from 'lucide-react';
import { WIDGET_CATALOG, WIDGET_CATEGORIES } from '@/config/widgetCatalog';
import { WidgetConfig } from '@/types/widget';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WidgetLibraryProps {
  open: boolean;
  onClose: () => void;
  onAddWidget: (widgetId: string) => void;
  onRemoveWidget: (widgetId: string) => void;
  activeWidgets: string[];
}

export const WidgetLibrary = memo(({
  open,
  onClose,
  onAddWidget,
  onRemoveWidget,
  activeWidgets,
}: WidgetLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localActive, setLocalActive] = useState<Set<string>>(new Set(activeWidgets));

  useEffect(() => {
    // Sync local active state when external active widgets change or dialog opens
    setLocalActive(new Set(activeWidgets));
  }, [activeWidgets, open]);

  const filteredWidgets = useMemo(() => {
    const allWidgets = Object.values(WIDGET_CATALOG);

    return allWidgets.filter(widget => {
      const matchesSearch = !searchQuery ||
        widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [searchQuery, selectedCategory]);

  const handleToggleWidget = async (widgetId: string, isActive: boolean) => {
    if (isActive) {
      // Update local state first for immediate feedback
      setLocalActive(prev => {
        const next = new Set(prev);
        next.delete(widgetId);
        return next;
      });

      // Then remove from backend
      await onRemoveWidget(widgetId);
    } else {
      // Add to local state first
      setLocalActive(prev => new Set(prev).add(widgetId));

      // Then add to backend
      await onAddWidget(widgetId);
    }
  };

  const handleAddAllInCategory = async () => {
    const widgetsToAdd = filteredWidgets.filter(w => !localActive.has(w.id));

    if (widgetsToAdd.length === 0) {
      toast.info('All widgets already added');
      return;
    }

    // Update local state first for immediate feedback
    setLocalActive(prev => {
      const next = new Set(prev);
      widgetsToAdd.forEach(w => next.add(w.id));
      return next;
    });

    // Then add all to backend
    for (const widget of widgetsToAdd) {
      await onAddWidget(widget.id);
    }

    toast.success(`Added ${widgetsToAdd.length} widget${widgetsToAdd.length === 1 ? '' : 's'}`);
  };

  const handleRemoveAll = async () => {
    const widgetsToRemove = Array.from(localActive);

    if (widgetsToRemove.length === 0) {
      toast.info('No widgets to remove');
      return;
    }

    // Clear local state first
    setLocalActive(new Set());

    // Then remove all from backend
    for (const widgetId of widgetsToRemove) {
      await onRemoveWidget(widgetId);
    }

    toast.success(`Removed ${widgetsToRemove.length} widget${widgetsToRemove.length === 1 ? '' : 's'}`);
  };

  const isWidgetActive = (widgetId: string) => localActive.has(widgetId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Widget Library</DialogTitle>
          <DialogDescription>
            Add widgets to customize your dashboard
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {WIDGET_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {WIDGET_CATEGORIES.map((category) => {
            const categoryWidgets = category.id === 'all'
              ? filteredWidgets
              : filteredWidgets.filter(w => w.category === category.id);

            return (
              <TabsContent
                key={category.id}
                value={category.id}
                className="flex-1 overflow-auto mt-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  <div className="flex gap-2">
                    {category.id !== 'all' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddAllInCategory}
                        className="gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add All
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveAll}
                      className="gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryWidgets.map((widget) => (
                    <WidgetCard
                      key={widget.id}
                      widget={widget}
                      isActive={isWidgetActive(widget.id)}
                      onToggle={() => handleToggleWidget(widget.id, isWidgetActive(widget.id))}
                      showCategory={category.id === 'all'}
                    />
                  ))}
                </div>

                {categoryWidgets.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No widgets found{searchQuery ? ` matching "${searchQuery}"` : ' in this category'}</p>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

WidgetLibrary.displayName = 'WidgetLibrary';

// Widget Card Component
interface WidgetCardProps {
  widget: WidgetConfig;
  isActive: boolean;
  onToggle: () => void;
  showCategory?: boolean;
}

const WidgetCard = memo(({ widget, isActive, onToggle, showCategory }: WidgetCardProps) => {
  const Icon = widget.icon;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        "hover:border-primary/50 hover:shadow-md",
        isActive && "bg-accent/20 border-primary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-sm">{widget.title}</h4>
            {showCategory && (
              <Badge variant="outline" className="text-xs capitalize">
                {widget.category}
              </Badge>
            )}
            {widget.isPremium && (
              <Badge variant="secondary" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            )}
            {isActive && (
              <Badge variant="outline" className="text-xs">
                Added
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {widget.description}
          </p>

          <Button
            size="sm"
            variant={isActive ? "destructive" : "default"}
            onClick={onToggle}
            className="w-full"
          >
            {isActive ? (
              <>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove Widget
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Widget
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

WidgetCard.displayName = 'WidgetCard';
