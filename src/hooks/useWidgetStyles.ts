import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WidgetStyle {
  id: string;
  style_id: string;
  style_name: string;
  unlock_requirement: string;
  required_level: number | null;
  style_config: any;
  is_unlocked: boolean;
  is_active: boolean;
}

export const useWidgetStyles = () => {
  const { user } = useAuth();
  const [styles, setStyles] = useState<WidgetStyle[]>([]);
  const [activeStyle, setActiveStyle] = useState<WidgetStyle | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStyles = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all styles
      const { data: allStyles } = await supabase
        .from('widget_styles')
        .select('*')
        .order('required_level', { ascending: true });

      // Fetch user's unlocked styles
      const { data: unlockedStyles } = await supabase
        .from('user_widget_styles')
        .select('*')
        .eq('user_id', user.id);

      // Fetch user XP to calculate level
      const { data: xpData } = await supabase
        .from('user_xp_levels')
        .select('total_xp_earned')
        .eq('user_id', user.id)
        .maybeSingle();

      // Calculate level from total XP
      const calculateLevel = (totalXP: number): number => {
        let level = 1;
        let xpNeeded = 100;
        let totalNeeded = 0;
        
        while (totalNeeded + xpNeeded <= totalXP) {
          totalNeeded += xpNeeded;
          level++;
          xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
        }
        
        return level;
      };

      const userLevel = xpData?.total_xp_earned ? calculateLevel(xpData.total_xp_earned) : 1;
      const unlockedIds = new Set(unlockedStyles?.map(s => s.style_id) || []);

      const formattedStyles = (allStyles || []).map(style => {
        const unlocked = unlockedStyles?.find(us => us.style_id === style.style_id);
        const meetsRequirement = !style.required_level || userLevel >= style.required_level;
        
        return {
          ...style,
          is_unlocked: unlockedIds.has(style.style_id) || meetsRequirement,
          is_active: unlocked?.is_active || false,
        };
      });

      setStyles(formattedStyles);
      const active = formattedStyles.find(s => s.is_active);
      setActiveStyle(active || formattedStyles[0] || null);
    } catch (error) {
      console.error('Error fetching widget styles:', error);
      toast.error('Failed to load widget styles');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  const selectStyle = async (styleId: string) => {
    if (!user) return;

    try {
      // Deactivate all styles
      await supabase
        .from('user_widget_styles')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate selected style (insert or update)
      const { error } = await supabase
        .from('user_widget_styles')
        .upsert({
          user_id: user.id,
          style_id: styleId,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Widget style updated!');
      fetchStyles();
    } catch (error) {
      console.error('Error selecting style:', error);
      toast.error('Failed to update widget style');
    }
  };

  return {
    styles,
    activeStyle,
    loading,
    selectStyle,
    refresh: fetchStyles,
  };
};
