import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_DASHBOARD_LAYOUT, WIDGET_CATALOG } from '@/config/widgetCatalog';
import { toast } from 'sonner';

export const useWidgetLayout = (userId: string | undefined, layoutKey: string = 'command-center') => {
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_DASHBOARD_LAYOUT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load layout from database
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadLayout = async () => {
      try {
        // Load layout based on layoutKey (e.g., 'command-center' or 'trade-station')
        const columnName = layoutKey === 'command-center' ? 'layout_json' : `layout_json_${layoutKey.replace(/-/g, '_')}`;
        
        const { data, error } = await supabase
          .from('user_settings')
          .select(columnName)
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error loading layout:', error);
          return;
        }

        const layoutData = data?.[columnName] as any;
        if (layoutData) {
          
          // Handle new format (array of widget IDs)
          if (Array.isArray(layoutData) && layoutData.length > 0 && typeof layoutData[0] === 'string') {
            setWidgetOrder(layoutData);
          }
          // Handle old format (array of layout objects with i, x, y, w, h)
          else if (Array.isArray(layoutData) && layoutData.length > 0 && layoutData[0].i) {
            const order = layoutData.map((item: any) => item.i);
            setWidgetOrder(order);
          }
          // Handle wrapped format
          else if (layoutData.layout) {
            if (Array.isArray(layoutData.layout) && layoutData.layout.length > 0) {
              if (typeof layoutData.layout[0] === 'string') {
                setWidgetOrder(layoutData.layout);
              } else if (layoutData.layout[0].i) {
                const order = layoutData.layout.map((item: any) => item.i);
                setWidgetOrder(order);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load layout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, [userId]);

  // Save layout to database
  const saveLayout = useCallback(async (newOrder: string[]) => {
    if (!userId) return;

    setIsSaving(true);
    try {
      // Save layout to the correct column based on layoutKey
      const columnName = layoutKey === 'command-center' ? 'layout_json' : `layout_json_${layoutKey.replace(/-/g, '_')}`;
      
      const { error } = await supabase
        .from('user_settings')
        .update({
          [columnName]: newOrder as any,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      toast.success('Dashboard layout saved');
    } catch (error) {
      console.error('Failed to save layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  }, [userId]);

  // Update layout without saving
  const updateLayout = useCallback((newOrder: string[]) => {
    setWidgetOrder(newOrder);
  }, []);

  // Add widget to layout
  const addWidget = useCallback((widgetId: string) => {
    const widget = WIDGET_CATALOG[widgetId];
    if (!widget) return;

    if (widgetOrder.includes(widgetId)) {
      toast.info('Widget already added');
      return;
    }

    const newOrder = [...widgetOrder, widgetId];
    setWidgetOrder(newOrder);
    saveLayout(newOrder);
    toast.success(`${widget.title} added`);
  }, [widgetOrder, saveLayout]);

  // Remove widget from layout
  const removeWidget = useCallback((widgetId: string) => {
    const newOrder = widgetOrder.filter(id => id !== widgetId);
    setWidgetOrder(newOrder);
    saveLayout(newOrder);
    
    const widget = WIDGET_CATALOG[widgetId];
    toast.success(`${widget?.title || 'Widget'} removed`);
  }, [widgetOrder, saveLayout]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setWidgetOrder(DEFAULT_DASHBOARD_LAYOUT);
    saveLayout(DEFAULT_DASHBOARD_LAYOUT);
    toast.success('Dashboard reset to default');
  }, [saveLayout]);

  // Get active widget IDs
  const activeWidgets = widgetOrder;

  return {
    layout: widgetOrder,
    isLoading,
    isSaving,
    updateLayout,
    saveLayout,
    addWidget,
    removeWidget,
    resetLayout,
    activeWidgets,
  };
};
