import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useXPSystem = () => {
    const { user } = useAuth();
    const [xp, setXP] = useState(0);
    const [level, setLevel] = useState(1);

    const addXP = useCallback(async (
        amount: number,
        source: string,
        description?: string
    ) => {
        if (!user) return;

        try {
            // Update user progression
            const { data: progression } = await supabase
                .from('user_progression')
                .select('xp, level')
                .eq('user_id', user.id)
                .maybeSingle();

            const currentXP = progression?.xp || 0;
            const newXP = currentXP + amount;

            // Simple level calculation: 100 XP per level
            const newLevel = Math.floor(newXP / 100) + 1;

            await supabase
                .from('user_progression')
                .upsert({
                    user_id: user.id,
                    xp: newXP,
                    level: newLevel,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            setXP(newXP);
            setLevel(newLevel);

            console.log(`[XP] +${amount} from ${source}: ${description}`);
        } catch (error) {
            console.error('Failed to add XP:', error);
        }
    }, [user]);

    return {
        xp,
        level,
        addXP,
    };
};
