import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Marca o onboarding como concluído. Escreve no banco e deixa uma marca
 *  local — user_settings é único por sub-conta e pode nem existir, e falhar
 *  a escrita não pode significar o modal voltando para sempre. */
export const persistOnboardingDone = async (userId: string): Promise<void> => {
  try {
    localStorage.setItem(`ttd:onboarding-done:${userId}`, '1');
  } catch {
    // modo privado / storage cheio: o banco abaixo ainda resolve
  }
  const { error } = await supabase
    .from('user_settings')
    .update({ onboarding_completed: true })
    .eq('user_id', userId);
  if (error) console.error('persist onboarding failed:', error.message);
};

export const useOnboarding = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (localStorage.getItem(`ttd:onboarding-done:${user.id}`)) {
        setShowOnboarding(false);
        return;
      }

      const [settingsRes, tradesRes] = await Promise.all([
        supabase
          .from('user_settings')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('trades')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null),
      ]);

      // Quem já tem trade registrado está onboarded na prática — perguntar de
      // novo é o bug que fazia o modal voltar depois de cada upload.
      if ((tradesRes.count ?? 0) > 0) {
        setShowOnboarding(false);
        void persistOnboardingDone(user.id);
        return;
      }

      if (settingsRes.error) {
        console.error('Error checking onboarding status:', settingsRes.error);
        setShowOnboarding(false); // erro de leitura não vira modal infinito
        return;
      }

      setShowOnboarding(!settingsRes.data?.onboarding_completed);
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
      setShowOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    if (user) void persistOnboardingDone(user.id);
  };

  return {
    showOnboarding,
    loading,
    completeOnboarding,
  };
};
