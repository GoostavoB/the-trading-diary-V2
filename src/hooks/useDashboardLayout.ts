import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
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
  { id: 'premiumCTA', visible: false },
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
];

export function useDashboardLayout() {
  const { user } = useAuth();
  const { activeSubAccount } = useSubAccount();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && activeSubAccount) {
      loadLayout();
    }
  }, [user, activeSubAccount]);

  const loadLayout = async () => {
    if (!user || !activeSubAccount) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('layout_json')
        .eq('sub_account_id', activeSubAccount.id)
        .maybeSingle();

      if (error) throw error;

      // Check if layout_json exists and has valid data
      const savedLayout = data?.layout_json as unknown as DashboardLayout;
      const hasValidLayout = savedLayout?.widgets?.length > 0 && savedLayout?.layout?.length > 0;

      if (hasValidLayout) {
        // Sanitize: keep only known widget IDs and ensure missing defaults are added
        const knownIds = new Set(DEFAULT_LAYOUT.map((l) => l.i));
        const defaultLayoutMap = new Map(DEFAULT_LAYOUT.map((l) => [l.i, l] as const));
        const defaultWidgetMap = new Map(DEFAULT_WIDGETS.map((w) => [w.id, w] as const));

        let filteredLayout = (savedLayout.layout || []).filter((item) => knownIds.has(item.i));
        for (const id of knownIds) {
          if (!filteredLayout.some((i) => i.i === id)) {
            const def = defaultLayoutMap.get(id);
            if (def) filteredLayout.push(def);
          }
        }

        let filteredWidgets = (savedLayout.widgets || []).filter((w) => knownIds.has(w.id));
        for (const id of knownIds) {
          if (!filteredWidgets.some((w) => w.id === id)) {
            const def = defaultWidgetMap.get(id);
            if (def) filteredWidgets.push(def);
          }
        }

        // If after filtering we still have no layout, fall back to defaults
        if (filteredLayout.length === 0) {
          filteredLayout = DEFAULT_LAYOUT;
        }
        if (filteredWidgets.length === 0) {
          filteredWidgets = DEFAULT_WIDGETS;
        }

        setWidgets(filteredWidgets);
        setLayout(filteredLayout);

        // Persist sanitized layout back to the backend
        await supabase
          .from('user_settings')
          .update({ layout_json: { widgets: filteredWidgets, layout: filteredLayout } as any })
          .eq('sub_account_id', activeSubAccount.id);
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
          .eq('sub_account_id', activeSubAccount.id);
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
    if (!user || !activeSubAccount) return;

    setIsSaving(true);
    try {
      const layoutData: DashboardLayout = {
        widgets,
        layout,
      };

      const { error } = await supabase
        .from('user_settings')
        .update({ layout_json: layoutData as any })
        .eq('sub_account_id', activeSubAccount.id);

      if (error) throw error;

      toast.success('Layout saved ✓', { duration: 2000 });
      setHasChanges(false);
      setIsCustomizing(false);
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced auto-save function
  const debouncedSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    setIsSaving(true);
    autoSaveTimerRef.current = setTimeout(async () => {
      await saveLayout();
    }, 2000);
  }, [widgets, layout, user, activeSubAccount]);

  const resetLayout = async () => {
    if (!user || !activeSubAccount) return;

    setLoading(true);
    try {
      const layoutData: DashboardLayout = {
        widgets: DEFAULT_WIDGETS,
        layout: DEFAULT_LAYOUT,
      };

      const { error } = await supabase
        .from('user_settings')
        .update({ layout_json: layoutData as any })
        .eq('sub_account_id', activeSubAccount.id);

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
    debouncedSave();
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
    isSaving,
    setIsCustomizing,
    toggleWidgetVisibility,
    updateLayout,
    saveLayout,
    resetLayout,
    cancelCustomization,
    isWidgetVisible,
  };
}
