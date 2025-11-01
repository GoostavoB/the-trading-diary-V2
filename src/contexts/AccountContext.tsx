import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Account {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  type: string | null;
  color: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface AccountContextType {
  accounts: Account[];
  activeAccount: Account | null;
  isLoading: boolean;
  switchAccount: (accountId: string) => Promise<void>;
  refetchAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!user) {
      setAccounts([]);
      setActiveAccountId(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Accounts] Fetching accounts...');
      
      const response = await fetch(
        `https://qziawervfvptoretkjrn.supabase.co/functions/v1/accounts`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Accounts fetch failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Accounts] Fetched:', { accounts: data.accounts?.length, activeAccountId: data.activeAccountId });

      setAccounts(data.accounts || []);
      setActiveAccountId(data.activeAccountId);
    } catch (error) {
      console.error('[Accounts] Error fetching accounts:', error);
      toast.error('Failed to load accounts. Using default view.');
      setAccounts([]);
      setActiveAccountId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = async (accountId: string) => {
    try {
      console.log('[Accounts] Activating account:', accountId);
      
      const response = await fetch(
        `https://qziawervfvptoretkjrn.supabase.co/functions/v1/accounts/${accountId}/activate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Account activation failed: ${response.status}`);
      }

      setActiveAccountId(accountId);
      window.location.reload();
    } catch (error) {
      console.error('[Accounts] Error switching account:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Subscribe to account changes
    // Subscribe to account and profile changes
    const channel = supabase
      .channel('account-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_accounts',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchAccounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`,
        },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const activeAccount = accounts.find((acc) => acc.id === activeAccountId) || null;

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccount,
        isLoading,
        switchAccount,
        refetchAccounts: fetchAccounts,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};
