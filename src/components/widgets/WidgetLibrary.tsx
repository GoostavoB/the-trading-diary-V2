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
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const [localActive, setLocalActive] = useState<Set<string>>(new Set(activeWidgets));

  useEffect(() => {
    // Sync local active state when external active widgets change or dialog opens
    setLocalActive(new Set(activeWidgets));
  }, [activeWidgets, open]);

  const filteredWidgets = Object.values(WIDGET_CATALOG).filter(widget => {
    const matchesSearch = widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || widget.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleWidget = (widgetId: string, isActive: boolean) => {
    if (isActive) {
      onRemoveWidget(widgetId);
      setLocalActive(prev => {
        const next = new Set(prev);
        next.delete(widgetId);
        return next;
      });
    } else {
      onAddWidget(widgetId);
      setLocalActive(prev => new Set(prev).add(widgetId));
    }
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
          <TabsList className="grid w-full grid-cols-6">
            {WIDGET_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {WIDGET_CATEGORIES.map((category) => (
            <TabsContent 
              key={category.id} 
              value={category.id}
              className="flex-1 overflow-auto mt-4"
            >
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWidgets
                  .filter(w => w.category === category.id)
                  .map((widget) => (
                    <WidgetCard
                      key={widget.id}
                      widget={widget}
                      isActive={isWidgetActive(widget.id)}
                      onToggle={() => handleToggleWidget(widget.id, isWidgetActive(widget.id))}
                    />
                  ))}
              </div>

              {filteredWidgets.filter(w => w.category === category.id).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No widgets found in this category</p>
                </div>
              )}
            </TabsContent>
          ))}
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
}

const WidgetCard = memo(({ widget, isActive, onToggle }: WidgetCardProps) => {
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
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{widget.title}</h4>
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
