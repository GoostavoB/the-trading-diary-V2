import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TradingSetup {
  id: string;
  user_id: string;
  name: string;
  author: string | null;
  timeframe: string | null;
  description: string | null;
  entry_rules: string[];
  indicators: string[];
  pitfalls: string | null;
  image_urls: string[];
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface SetupInput {
  name: string;
  author: string;
  timeframe: string;
  description: string;
  entry_rules: string[];
  indicators: string[];
  pitfalls: string;
  image_urls: string[];
}

export const SETUP_IMAGES_BUCKET = 'setup-images';

export const useSetupLibrary = () => {
  const { user } = useAuth();
  const [setups, setSetups] = useState<TradingSetup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSetups = useCallback(async () => {
    if (!user) {
      setSetups([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_setups')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error fetching setups:', error);
      setLoading(false);
      return;
    }

    setSetups((data || []) as TradingSetup[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSetups().catch(() => setLoading(false));
  }, [fetchSetups]);

  const saveSetup = async (input: SetupInput, id?: string) => {
    if (!user) return false;

    const payload = {
      user_id: user.id,
      name: input.name.trim(),
      author: input.author.trim() || null,
      timeframe: input.timeframe.trim() || null,
      description: input.description.trim() || null,
      entry_rules: input.entry_rules.filter((r) => r.trim().length > 0),
      indicators: input.indicators.filter((i) => i.trim().length > 0),
      pitfalls: input.pitfalls.trim() || null,
      image_urls: input.image_urls,
    };

    const { error } = id
      ? await supabase.from('user_setups').update(payload).eq('id', id)
      : await supabase.from('user_setups').insert(payload);

    if (error) {
      toast.error(error.code === '23505' ? 'A setup with this name already exists' : 'Failed to save setup');
      return false;
    }

    toast.success(id ? 'Setup updated' : 'Setup created');
    await fetchSetups().catch(() => {});
    return true;
  };

  const deleteSetup = async (id: string) => {
    const { error } = await supabase.from('user_setups').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete setup');
      return;
    }
    toast.success('Setup deleted');
    await fetchSetups().catch(() => {});
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop() || 'png';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(SETUP_IMAGES_BUCKET).upload(path, file);
    if (error) {
      toast.error('Failed to upload image');
      return null;
    }
    return path;
  };

  const removeImage = async (path: string) => {
    await supabase.storage.from(SETUP_IMAGES_BUCKET).remove([path]).catch(() => {});
  };

  return { setups, loading, fetchSetups, saveSetup, deleteSetup, uploadImage, removeImage };
};

/** Setup images live in a private bucket — resolve short-lived signed URLs for display. */
export const useSignedSetupImages = (paths: string[]) => {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = paths.join('|');

  useEffect(() => {
    let cancelled = false;
    const list = key ? key.split('|') : [];
    if (list.length === 0) {
      setUrls({});
      return;
    }

    supabase.storage
      .from(SETUP_IMAGES_BUCKET)
      .createSignedUrls(list, 3600)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const map: Record<string, string> = {};
        data.forEach((item) => {
          if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
        });
        setUrls(map);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [key]);

  return urls;
};
