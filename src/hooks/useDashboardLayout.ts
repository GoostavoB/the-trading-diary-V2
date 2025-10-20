import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WidgetConfig {
  id: string;
  visible: boolean;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

interface DashboardLayout {
  widgets: WidgetConfig[];
  layout: LayoutItem[];
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'totalBalance', visible: true },
  { id: 'stats', visible: true },
  { id: 'portfolio', visible: true },
  { id: 'topMovers', visible: true },
  { id: 'quickActions', visible: true },
  { id: 'recentTransactions', visible: true },
  { id: 'insights', visible: true },
  // Hidden by default but available in customize
  { id: 'premiumCTA', visible: false },
  { id: 'streaks', visible: false },
  { id: 'heatmap', visible: false },
  { id: 'charts', visible: false },
];

const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'totalBalance', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3, maxH: 6 },
  { i: 'stats', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3, maxH: 6 },
  { i: 'portfolio', x: 0, y: 4, w: 6, h: 5, minW: 4, minH: 4, maxH: 8 },
  { i: 'topMovers', x: 6, y: 4, w: 3, h: 5, minW: 3, minH: 4, maxH: 8 },
  { i: 'quickActions', x: 9, y: 4, w: 3, h: 5, minW: 3, minH: 4, maxH: 8 },
  { i: 'recentTransactions', x: 0, y: 9, w: 9, h: 4, minW: 6, minH: 3, maxH: 6 },
  { i: 'premiumCTA', x: 9, y: 9, w: 3, h: 4, minW: 3, minH: 3, maxH: 6 },
  { i: 'insights', x: 0, y: 13, w: 12, h: 2, minW: 6, minH: 2, maxH: 4 },
  { i: 'streaks', x: 0, y: 15, w: 12, h: 2, minW: 6, minH: 2, maxH: 4 },
  { i: 'heatmap', x: 0, y: 17, w: 12, h: 4, minW: 6, minH: 3, maxH: 8 },
  { i: 'charts', x: 0, y: 21, w: 12, h: 5, minW: 6, minH: 4, maxH: 10 },
];

export function useDashboardLayout() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      loadLayout();
    }
  }, [user]);

  const loadLayout = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('layout_json')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Check if layout_json exists and has valid data
      const savedLayout = data?.layout_json as unknown as DashboardLayout;
      const hasValidLayout = savedLayout?.widgets?.length > 0 && savedLayout?.layout?.length > 0;

      if (hasValidLayout) {
        setWidgets(savedLayout.widgets);
        setLayout(savedLayout.layout);
      } else {
        // Initialize with defaults and save to database
        console.log('No valid layout found, initializing defaults...');
        setWidgets(DEFAULT_WIDGETS);
        setLayout(DEFAULT_LAYOUT);
        
        // Save defaults to database immediately
        const layoutData: DashboardLayout = {
          widgets: DEFAULT_WIDGETS,
          layout: DEFAULT_LAYOUT,
        };

        await supabase
          .from('user_settings')
          .update({ layout_json: layoutData as any })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error loading layout:', error);
      // On error, use defaults
      setWidgets(DEFAULT_WIDGETS);
      setLayout(DEFAULT_LAYOUT);
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const layoutData: DashboardLayout = {
        widgets,
        layout,
      };

      const { error } = await supabase
        .from('user_settings')
        .update({ layout_json: layoutData as any })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Dashboard layout saved!');
      setHasChanges(false);
      setIsCustomizing(false);
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setLoading(false);
    }
  };

  const resetLayout = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const layoutData: DashboardLayout = {
        widgets: DEFAULT_WIDGETS,
        layout: DEFAULT_LAYOUT,
      };

      const { error } = await supabase
        .from('user_settings')
        .update({ layout_json: layoutData as any })
        .eq('user_id', user.id);

      if (error) throw error;

      setWidgets(DEFAULT_WIDGETS);
      setLayout(DEFAULT_LAYOUT);
      setHasChanges(false);
      toast.success('Dashboard layout reset to default');
    } catch (error) {
      console.error('Error resetting layout:', error);
      toast.error('Failed to reset layout');
    } finally {
      setLoading(false);
    }
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev =>
      prev.map(w => (w.id === widgetId ? { ...w, visible: !w.visible } : w))
    );
    setHasChanges(true);
  };

  const updateLayout = (newLayout: LayoutItem[]) => {
    setLayout(newLayout);
    setHasChanges(true);
  };

  const cancelCustomization = () => {
    loadLayout();
    setIsCustomizing(false);
    setHasChanges(false);
  };

  const isWidgetVisible = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    return widget?.visible ?? true;
  };

  return {
    widgets,
    layout,
    loading,
    isCustomizing,
    hasChanges,
    setIsCustomizing,
    toggleWidgetVisibility,
    updateLayout,
    saveLayout,
    resetLayout,
    cancelCustomization,
    isWidgetVisible,
  };
}
