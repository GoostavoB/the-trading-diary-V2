import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { supabase } from '@/integrations/supabase/client';

export interface RiskProfile {
  id: string;
  name: string;
  risk_pct: number;
  is_favorite: boolean;
  sort_order: number;
}

export function useRiskProfiles() {
  const { user } = useAuth();
  const { activeSubAccount } = useSubAccount();
  const queryClient = useQueryClient();

  const subAccountId = activeSubAccount?.id;
  const queryKey = ['risk-profiles', user?.id, subAccountId];

  const { data: profiles = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risk_profiles')
        .select('id, name, risk_pct, is_favorite, sort_order')
        .eq('user_id', user!.id)
        .eq('sub_account_id', subAccountId!)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as RiskProfile[];
    },
    enabled: !!user?.id && !!subAccountId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createProfile = async (name: string, riskPct: number) => {
    if (!user || !subAccountId) return;
    const maxOrder = profiles.reduce((max, p) => Math.max(max, p.sort_order), -1);
    const { error } = await supabase.from('risk_profiles').insert({
      user_id: user.id,
      sub_account_id: subAccountId,
      name,
      risk_pct: riskPct,
      sort_order: maxOrder + 1,
    });
    if (error) throw error;
    invalidate();
  };

  const deleteProfile = async (id: string) => {
    const { error } = await supabase.from('risk_profiles').delete().eq('id', id);
    if (error) throw error;
    invalidate();
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    const { error } = await supabase.from('risk_profiles').update({ is_favorite: isFavorite }).eq('id', id);
    if (error) throw error;
    invalidate();
  };

  const reorder = async (orderedIds: string[]) => {
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from('risk_profiles').update({ sort_order: index }).eq('id', id)
      )
    );
    invalidate();
  };

  const moveProfile = async (id: string, direction: 'up' | 'down') => {
    const index = profiles.findIndex((p) => p.id === id);
    if (index === -1) return;
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= profiles.length) return;

    const reordered = [...profiles];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    await reorder(reordered.map((p) => p.id));
  };

  return {
    profiles,
    isLoading,
    createProfile,
    deleteProfile,
    toggleFavorite,
    moveProfile,
  };
}
