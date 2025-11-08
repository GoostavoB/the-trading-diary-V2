import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Favorite {
  id: string;
  page_url: string;
  page_title: string;
  page_icon: string;
  display_order: number;
}

const FAVORITES_CACHE_KEY = 'userFavorites:v1';
const MAX_FAVORITES = 12;

export function useFavorites() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [localFavorites, setLocalFavorites] = useState<Favorite[]>([]);

  // Debug logging
  console.log('[useFavorites] Auth state:', { 
    hasUser: !!user, 
    userId: user?.id, 
    authLoading 
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(FAVORITES_CACHE_KEY);
      if (cached) {
        setLocalFavorites(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Failed to load favorites from cache:', error);
    }
  }, []);

  // Fetch favorites from database
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Update localStorage cache
      localStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(data));
      setLocalFavorites(data);
      
      return data as Favorite[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async ({ url, title, icon }: { url: string; title: string; icon: string }) => {
      console.log('[addFavoriteMutation] Starting:', { url, title, icon });
      
      if (!user) {
        console.error('[addFavoriteMutation] ERROR: No user');
        throw new Error('You must be signed in to add favorites');
      }

      // Check current count
      const currentCount = favorites.length;
      if (currentCount >= MAX_FAVORITES) {
        console.warn('[addFavoriteMutation] ERROR: Max favorites reached');
        throw new Error(`Maximum ${MAX_FAVORITES} favorites reached. Remove one to add another.`);
      }

      console.log('[addFavoriteMutation] Making Supabase insert request...');
      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          page_url: url,
          page_title: title,
          page_icon: icon,
          display_order: currentCount,
        })
        .select()
        .single();

      if (error) {
        console.error('[addFavoriteMutation] Supabase error:', error);
        throw error;
      }
      
      console.log('[addFavoriteMutation] Success:', data);
      return data;
    },
    onSuccess: () => {
      console.log('[addFavoriteMutation] onSuccess triggered');
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      toast.success('Added to favorites');
    },
    onError: (error: Error) => {
      console.error('[addFavoriteMutation] onError triggered:', error);
      toast.error(error.message || 'Failed to add favorite');
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (url: string) => {
      console.log('[removeFavoriteMutation] Starting:', { url });
      
      if (!user) {
        console.error('[removeFavoriteMutation] ERROR: No user');
        throw new Error('You must be signed in to remove favorites');
      }

      console.log('[removeFavoriteMutation] Making Supabase delete request...');
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('page_url', url);

      if (error) {
        console.error('[removeFavoriteMutation] Supabase error:', error);
        throw error;
      }
      
      console.log('[removeFavoriteMutation] Success');
    },
    onSuccess: () => {
      console.log('[removeFavoriteMutation] onSuccess triggered');
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      toast.success('Removed from favorites');
    },
    onError: (error: Error) => {
      console.error('[removeFavoriteMutation] onError triggered:', error);
      toast.error(error.message || 'Failed to remove favorite');
    },
  });

  // Reorder favorites mutation
  const reorderFavoritesMutation = useMutation({
    mutationFn: async (reorderedFavorites: Favorite[]) => {
      if (!user) throw new Error('Not authenticated');

      // Update display_order for each favorite individually
      for (let i = 0; i < reorderedFavorites.length; i++) {
        const fav = reorderedFavorites[i];
        const { error } = await supabase
          .from('user_favorites')
          .update({ display_order: i })
          .eq('id', fav.id)
          .eq('user_id', user.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to reorder favorites');
      console.error(error);
    },
  });

  const isFavorite = useCallback(
    (url: string) => {
      return favorites.some(fav => fav.page_url === url);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (url: string, title: string, icon: string) => {
      console.log('[toggleFavorite] Called:', { url, title, icon, authLoading, hasUser: !!user });
      
      // Auth loading guard
      if (authLoading) {
        console.log('[toggleFavorite] BLOCKED: Auth still loading');
        toast.error('Please wait while we verify your session...');
        return;
      }

      // Auth required guard
      if (!user) {
        console.log('[toggleFavorite] BLOCKED: No user authenticated');
        toast.error('Please sign in to manage favorites');
        return;
      }

      console.log('[toggleFavorite] Proceeding with mutation:', { 
        isFav: isFavorite(url),
        action: isFavorite(url) ? 'remove' : 'add'
      });

      if (isFavorite(url)) {
        console.log('[toggleFavorite] Calling removeFavoriteMutation');
        removeFavoriteMutation.mutate(url);
      } else {
        console.log('[toggleFavorite] Calling addFavoriteMutation');
        addFavoriteMutation.mutate({ url, title, icon });
      }
    },
    [isFavorite, addFavoriteMutation, removeFavoriteMutation, authLoading, user]
  );

  return {
    favorites: isLoading ? localFavorites : favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    reorderFavorites: reorderFavoritesMutation.mutate,
    isAddingFavorite: addFavoriteMutation.isPending,
    isRemovingFavorite: removeFavoriteMutation.isPending,
    isProcessing: addFavoriteMutation.isPending || removeFavoriteMutation.isPending || authLoading,
    canAddMore: favorites.length < MAX_FAVORITES,
    maxFavorites: MAX_FAVORITES,
  };
}