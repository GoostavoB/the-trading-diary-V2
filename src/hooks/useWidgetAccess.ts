import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { calculateTier } from '@/utils/xpEngine';
import { WIDGET_CATALOG } from '@/config/widgetCatalog';

interface WidgetAccessResult {
  canAccess: boolean;
  reason: 'unlocked' | 'locked_xp' | 'locked_plan' | 'locked_both';
  xpNeeded: number | null;
  tierNeeded: string | null;
  planNeeded: string | null;
}

export function useWidgetAccess() {
  const { user } = useAuth();

  // Fetch user XP data
  const { data: xpData } = useQuery({
    queryKey: ['user-xp', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_xp_levels')
        .select('total_xp_earned')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Fetch user manual unlocks
  const { data: manualUnlocks } = useQuery({
    queryKey: ['user-widget-unlocks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_widget_unlocks')
        .select('widget_id')
        .eq('user_id', user.id);
      return data?.map(u => u.widget_id) || [];
    },
    enabled: !!user,
  });

  // Fetch widget requirements
  const { data: widgetRequirements } = useQuery({
    queryKey: ['widget-tier-requirements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('widget_tier_requirements')
        .select('*');
      return data || [];
    },
  });

  // Get user's current tier based on XP
  const userTier = xpData ? calculateTier(xpData.total_xp_earned) : 0;
  const userXP = xpData?.total_xp_earned || 0;

  // For now, assume free plan (update when subscription system is ready)
  const userPlan = 'free';

  /**
   * Check if user can access a specific widget
   */
  const canAccessWidget = (widgetId: string): boolean => {
    // Check manual unlock first
    if (manualUnlocks?.includes(widgetId)) {
      return true;
    }

    // Get widget requirements
    const requirement = widgetRequirements?.find(r => r.widget_id === widgetId);
    if (!requirement) {
      // Widget not in requirements table = always accessible (backward compatibility)
      return true;
    }

    // Check XP tier requirement
    const hasRequiredTier = userTier >= requirement.tier_required;

    // Check plan requirement
    const planHierarchy = { free: 0, pro: 1, elite: 2 };
    const hasRequiredPlan = requirement.plan_required 
      ? planHierarchy[userPlan as keyof typeof planHierarchy] >= planHierarchy[requirement.plan_required as keyof typeof planHierarchy]
      : true;

    return hasRequiredTier || hasRequiredPlan;
  };

  /**
   * Get detailed access info for a widget
   */
  const getAccessReason = (widgetId: string): WidgetAccessResult => {
    if (manualUnlocks?.includes(widgetId)) {
      return {
        canAccess: true,
        reason: 'unlocked',
        xpNeeded: null,
        tierNeeded: null,
        planNeeded: null,
      };
    }

    const requirement = widgetRequirements?.find(r => r.widget_id === widgetId);
    if (!requirement) {
      return {
        canAccess: true,
        reason: 'unlocked',
        xpNeeded: null,
        tierNeeded: null,
        planNeeded: null,
      };
    }

    const hasRequiredTier = userTier >= requirement.tier_required;
    const planHierarchy = { free: 0, pro: 1, elite: 2 };
    const hasRequiredPlan = requirement.plan_required 
      ? planHierarchy[userPlan as keyof typeof planHierarchy] >= planHierarchy[requirement.plan_required as keyof typeof planHierarchy]
      : true;

    if (hasRequiredTier || hasRequiredPlan) {
      return {
        canAccess: true,
        reason: 'unlocked',
        xpNeeded: null,
        tierNeeded: null,
        planNeeded: null,
      };
    }

    // Widget is locked
    const xpNeeded = !hasRequiredTier ? requirement.xp_to_unlock - userXP : null;
    const tierNeeded = !hasRequiredTier ? requirement.tier_name : null;
    const planNeeded = !hasRequiredPlan ? requirement.plan_required : null;

    let reason: 'locked_xp' | 'locked_plan' | 'locked_both' = 'locked_xp';
    if (!hasRequiredTier && !hasRequiredPlan) {
      reason = 'locked_both';
    } else if (!hasRequiredPlan) {
      reason = 'locked_plan';
    }

    return {
      canAccess: false,
      reason,
      xpNeeded,
      tierNeeded,
      planNeeded,
    };
  };

  /**
   * Get list of locked widgets
   */
  const getLockedWidgets = () => {
    return Object.values(WIDGET_CATALOG).filter(widget => !canAccessWidget(widget.id));
  };

  /**
   * Get XP needed to unlock a widget
   */
  const getXPNeeded = (widgetId: string): number | null => {
    const accessInfo = getAccessReason(widgetId);
    return accessInfo.xpNeeded;
  };

  /**
   * Get next widget that will unlock
   */
  const getNextUnlock = () => {
    const locked = getLockedWidgets();
    if (locked.length === 0) return null;

    // Sort by XP required (ascending)
    const sortedByXP = locked
      .map(widget => {
        const requirement = widgetRequirements?.find(r => r.widget_id === widget.id);
        return {
          widget,
          xpNeeded: requirement ? requirement.xp_to_unlock - userXP : Infinity,
        };
      })
      .filter(item => item.xpNeeded > 0)
      .sort((a, b) => a.xpNeeded - b.xpNeeded);

    return sortedByXP[0]?.widget || null;
  };

  return {
    canAccessWidget,
    getAccessReason,
    getLockedWidgets,
    getXPNeeded,
    getNextUnlock,
    userTier,
    userXP,
    isLoading: !widgetRequirements || !manualUnlocks,
  };
}
