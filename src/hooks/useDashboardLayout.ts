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
  { id: 'stats', visible: true },
  { id: 'insights', visible: true },
  { id: 'streaks', visible: true },
  { id: 'heatmap', visible: true },
  { id: 'charts', visible: true },
];

const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'stats', x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3, maxH: 6 },
  { i: 'insights', x: 0, y: 4, w: 12, h: 2, minW: 6, minH: 2, maxH: 4 },
  { i: 'streaks', x: 0, y: 6, w: 12, h: 2, minW: 6, minH: 2, maxH: 4 },
  { i: 'heatmap', x: 0, y: 8, w: 12, h: 4, minW: 6, minH: 3, maxH: 8 },
  { i: 'charts', x: 0, y: 12, w: 12, h: 5, minW: 6, minH: 4, maxH: 10 },
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

      if (data?.layout_json && typeof data.layout_json === 'object') {
        const savedLayout = data.layout_json as unknown as DashboardLayout;
        if (savedLayout.widgets) setWidgets(savedLayout.widgets);
        if (savedLayout.layout) setLayout(savedLayout.layout);
      }
    } catch (error) {
      console.error('Error loading layout:', error);
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
