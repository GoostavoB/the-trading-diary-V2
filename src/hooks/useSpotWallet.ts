import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SpotHolding {
  id: string;
  token_symbol: string;
  token_name: string;
  quantity: number;
  purchase_price?: number;
  purchase_date?: string;
  exchange?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SpotTransaction {
  id: string;
  holding_id?: string;
  token_symbol: string;
  transaction_type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  quantity: number;
  price: number;
  total_value: number;
  exchange?: string;
  transaction_date: string;
  notes?: string;
  created_at: string;
}

export const useSpotWallet = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: holdings, isLoading } = useQuery({
    queryKey: ['spot-holdings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spot_holdings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SpotHolding[];
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ['spot-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spot_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as SpotTransaction[];
    },
  });

  const addHolding = useMutation({
    mutationFn: async (holding: Omit<SpotHolding, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('spot_holdings')
        .insert([{ ...holding, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spot-holdings'] });
      toast({
        title: 'Token Added',
        description: 'Your token has been added to the spot wallet.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateHolding = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SpotHolding> & { id: string }) => {
      const { data, error } = await supabase
        .from('spot_holdings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spot-holdings'] });
      toast({
        title: 'Updated',
        description: 'Token holding updated successfully.',
      });
    },
  });

  const deleteHolding = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('spot_holdings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spot-holdings'] });
      toast({
        title: 'Deleted',
        description: 'Token removed from spot wallet.',
      });
    },
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: Omit<SpotTransaction, 'id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('spot_transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spot-transactions'] });
    },
  });

  return {
    holdings: holdings || [],
    transactions: transactions || [],
    isLoading,
    addHolding,
    updateHolding,
    deleteHolding,
    addTransaction,
  };
};
