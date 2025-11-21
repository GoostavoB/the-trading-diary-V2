import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubAccount {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

interface SubAccountContextType {
  activeSubAccount: SubAccount | null;
  subAccounts: SubAccount[];
  loading: boolean;
  refreshSubAccounts: () => Promise<void>;
}

const SubAccountContext = createContext<SubAccountContextType | undefined>(undefined);

export function SubAccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeSubAccount, setActiveSubAccount] = useState<SubAccount | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubAccounts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sub_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setSubAccounts(data || []);
      
      // Find active sub-account
      const active = data?.find(acc => acc.is_active);
      setActiveSubAccount(active || null);
    } catch (error) {
      console.error('Error fetching sub-accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAccounts();
    
    // Set up realtime subscription for sub-accounts changes
    const channel = supabase
      .channel('sub-accounts-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'sub_accounts',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchSubAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <SubAccountContext.Provider 
      value={{ 
        activeSubAccount, 
        subAccounts, 
        loading,
        refreshSubAccounts: fetchSubAccounts 
      }}
    >
      {children}
    </SubAccountContext.Provider>
  );
}

export function useSubAccount() {
  const context = useContext(SubAccountContext);
  if (context === undefined) {
    throw new Error('useSubAccount must be used within a SubAccountProvider');
  }
  return context;
}
