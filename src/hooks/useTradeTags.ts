import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Generic, fully user-creatable tag system.
 * Three categories, none of them a closed list: the values below are just
 * initial suggestions seeded once per user — they can be renamed or deleted.
 */
export type TagCategory = 'setup' | 'error' | 'market';

export interface TradeTag {
  id: string;
  name: string;
  category: TagCategory;
}

export const TAG_CATEGORY_META: Record<
  TagCategory,
  { label: string; description: string; placeholder: string; badgeClass: string }
> = {
  setup: {
    label: 'Setup',
    description: 'How you entered the trade.',
    placeholder: 'Search or create a setup tag...',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  error: {
    label: 'Error / Lesson',
    description: 'What went wrong, or what you learned.',
    placeholder: 'Search or create an error/lesson tag...',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  },
  market: {
    label: 'Market rule / context',
    description: 'Market condition or rule that applied (e.g. "Shorted with low LSR").',
    placeholder: 'Search or create a market rule tag...',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
};

export const EMOTIONAL_TAG_BADGE_CLASS =
  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';

const INITIAL_SUGGESTIONS: Record<TagCategory, string[]> = {
  setup: ['Breakout', 'Pullback', 'Range reversal', 'Trend continuation', 'False breakout'],
  error: ['No stop loss', 'Entered late', 'Moved my stop', 'Broke my plan', 'Overleveraged'],
  market: ['Shorted with low LSR', 'High funding', 'Against the trend', 'News event', 'Low liquidity'],
};

const CATEGORIES: TagCategory[] = ['setup', 'error', 'market'];

export function useTradeTags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['trade-tags', user?.id],
    queryFn: async (): Promise<TradeTag[]> => {
      const { data, error } = await supabase
        .from('custom_tags')
        .select('id, tag_name, tag_type')
        .eq('user_id', user?.id)
        .in('tag_type', CATEGORIES)
        .order('tag_name');
      if (error) throw error;
      return (data || []).map((t) => ({
        id: t.id,
        name: t.tag_name,
        category: t.tag_type as TagCategory,
      }));
    },
    enabled: !!user?.id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['trade-tags', user?.id] });

  // Seed the initial suggestions once, only for users with no tags at all.
  useEffect(() => {
    if (!user?.id || isLoading || tags.length > 0) return;
    let cancelled = false;
    (async () => {
      const rows = CATEGORIES.flatMap((category) =>
        INITIAL_SUGGESTIONS[category].map((name) => ({
          user_id: user.id,
          tag_name: name,
          tag_type: category,
        }))
      );
      const { error } = await supabase.from('custom_tags').insert(rows);
      if (!cancelled && !error) invalidate();
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoading, tags.length]);

  const tagsByCategory = (category: TagCategory) => tags.filter((t) => t.category === category);

  const createTag = async (category: TagCategory, name: string): Promise<TradeTag | null> => {
    const trimmed = name.trim();
    if (!trimmed || !user?.id) return null;
    const existing = tags.find(
      (t) => t.category === category && t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    const { data, error } = await supabase
      .from('custom_tags')
      .insert({ user_id: user.id, tag_name: trimmed, tag_type: category })
      .select('id, tag_name, tag_type')
      .maybeSingle();

    if (error || !data) {
      toast.error(error?.code === '23505' ? 'Tag already exists' : 'Failed to create tag');
      return null;
    }
    invalidate();
    return { id: data.id, name: data.tag_name, category: data.tag_type as TagCategory };
  };

  const renameTag = async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !user?.id) return false;
    const current = tags.find((t) => t.id === id);
    if (!current) return false;

    const { error } = await supabase
      .from('custom_tags')
      .update({ tag_name: trimmed })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(error.code === '23505' ? 'Tag already exists' : 'Failed to rename tag');
      return false;
    }

    // Keep trades pointing at the renamed tag
    if (current.name !== trimmed) {
      const column = TRADE_COLUMN[current.category];
      const { data: affected } = await supabase
        .from('trades')
        .select(`id, ${column}`)
        .eq('user_id', user.id)
        .contains(column, [current.name]);

      for (const row of (affected || []) as any[]) {
        const next = ((row[column] as string[]) || []).map((t) => (t === current.name ? trimmed : t));
        await supabase.from('trades').update({ [column]: next }).eq('id', row.id);
      }
    }

    invalidate();
    return true;
  };

  const deleteTag = async (id: string) => {
    if (!user?.id) return false;
    const { error } = await supabase.from('custom_tags').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast.error('Failed to delete tag');
      return false;
    }
    invalidate();
    return true;
  };

  return { tags, tagsByCategory, isLoading, createTag, renameTag, deleteTag };
}

export const TRADE_COLUMN: Record<TagCategory, 'setup_tags' | 'error_tags' | 'market_tags'> = {
  setup: 'setup_tags',
  error: 'error_tags',
  market: 'market_tags',
};
