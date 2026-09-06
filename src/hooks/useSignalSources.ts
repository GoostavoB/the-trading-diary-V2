import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SignalSource {
  id: string;
  name: string;
}

export const DEFAULT_SIGNAL_SOURCE = 'Meu';

export const DEFAULT_SIGNAL_SOURCES = [
  'Meu',
  'Oristic - Conservador',
  'Oristic - Arrojado',
  'Oristic - Arriscado',
  'Realista',
  'Moderado',
];

export function useSignalSources() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['signal-sources', user?.id],
    queryFn: async (): Promise<SignalSource[]> => {
      const { data, error } = await supabase
        .from('signal_sources')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['signal-sources', user?.id] });

  // Seed the initial list once for users who have none yet
  useEffect(() => {
    if (!user?.id || isLoading || sources.length > 0) return;
    let cancelled = false;
    (async () => {
      const { error } = await supabase
        .from('signal_sources')
        .insert(DEFAULT_SIGNAL_SOURCES.map((name) => ({ user_id: user.id, name })));
      if (!cancelled && !error) invalidate();
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoading, sources.length]);

  const createSource = async (name: string): Promise<SignalSource | null> => {
    const trimmed = name.trim();
    if (!trimmed || !user?.id) return null;
    const existing = sources.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const { data, error } = await supabase
      .from('signal_sources')
      .insert({ user_id: user.id, name: trimmed })
      .select('id, name')
      .maybeSingle();

    if (error) {
      toast.error(error.code === '23505' ? 'Source already exists' : 'Failed to create source');
      return null;
    }
    invalidate();
    return data;
  };

  const renameSource = async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !user?.id) return false;
    const current = sources.find((s) => s.id === id);

    const { error } = await supabase
      .from('signal_sources')
      .update({ name: trimmed })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(error.code === '23505' ? 'Source already exists' : 'Failed to rename source');
      return false;
    }

    // Keep existing trades pointing at the renamed source
    if (current && current.name !== trimmed) {
      await supabase
        .from('trades')
        .update({ signal_source: trimmed })
        .eq('user_id', user.id)
        .eq('signal_source', current.name);
    }

    invalidate();
    return true;
  };

  const deleteSource = async (id: string) => {
    if (!user?.id) return false;
    const { error } = await supabase
      .from('signal_sources')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Failed to delete source');
      return false;
    }
    invalidate();
    return true;
  };

  return { sources, isLoading, createSource, renameSource, deleteSource };
}
