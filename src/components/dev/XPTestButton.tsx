import { Button } from '@/components/ui/button';
import { Zap, FlaskConical, RotateCcw } from 'lucide-react';
import { useXPSystem } from '@/hooks/useXPSystem';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTier } from '@/hooks/useUserTier';

export function XPTestButton() {
  const { addXP, refresh: refreshXP } = useXPSystem();
  const { refresh: refreshTier } = useUserTier();
  const { user } = useAuth();

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleTestXP = async () => {
    try {
      if (!user) {
        toast.error('Please sign in to award XP');
        return;
      }
      console.debug('[XPTestButton] Adding +100 XP for user:', user.id);
      await addXP(100, 'test', 'Dev test XP award');
      // Refresh both XP and tier data immediately
      await Promise.all([refreshXP?.(), refreshTier?.()]);
      toast.success('Test XP awarded! Check DailyMissionBar above.', {
        description: '+100 XP added to your daily total',
      });
      console.debug('[XPTestButton] XP added successfully');
    } catch (error) {
      console.error('[XPTestButton] Failed to add XP:', error);
      toast.error('Failed to award test XP', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleResetDailyXP = async () => {
    try {
      if (!user) {
        toast.error('Please sign in to reset XP');
        return;
      }
      console.debug('[XPTestButton] Resetting daily XP for user:', user.id);
      const { error } = await supabase
        .from('user_xp_tiers')
        .upsert(
          {
            user_id: user.id,
            daily_xp_earned: 0,
            last_reset_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
      
      // Force immediate refetch of both queries
      await Promise.all([
        refreshXP?.(),
        refreshTier?.()
      ]);
      
      toast.success("Today's XP reset to 0");
      console.debug('[XPTestButton] Daily XP reset successfully');
    } catch (error) {
      console.error('[XPTestButton] Failed to reset daily XP:', error);
      toast.error('Failed to reset daily XP', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] pointer-events-auto space-y-2">
      <Button
        onClick={handleTestXP}
        variant="outline"
        className="gap-2 bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
        size="lg"
        disabled={!user}
      >
        <FlaskConical className="w-4 h-4" />
        <Zap className="w-4 h-4" />
        +100 XP (Test Only)
      </Button>
      <Button
        onClick={handleResetDailyXP}
        variant="outline"
        className="gap-2"
        size="lg"
        disabled={!user}
      >
        <RotateCcw className="w-4 h-4" />
        Reset Daily XP (Dev)
      </Button>
    </div>
  );
}
