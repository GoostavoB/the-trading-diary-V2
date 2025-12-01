import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Challenge {
    id: string;
    type: string;
    target: number;
    progress: number;
    completed: boolean;
}

export const useDailyChallenges = () => {
    const { user } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);

    const updateChallengeProgress = useCallback(async (
        challengeType: string,
        progress: number
    ) => {
        if (!user) return;

        try {
            // Update challenge progress in database
            const { data } = await supabase
                .from('daily_challenges')
                .select('*')
                .eq('user_id', user.id)
                .eq('challenge_type', challengeType)
                .eq('challenge_date', new Date().toISOString().split('T')[0])
                .maybeSingle();

            if (data) {
                await supabase
                    .from('daily_challenges')
                    .update({
                        current_progress: Math.max(data.current_progress, progress),
                        is_completed: progress >= data.target_value,
                    })
                    .eq('id', data.id);
            }

            console.log(`[Challenge] ${challengeType}: ${progress}`);
        } catch (error) {
            console.error('Failed to update challenge:', error);
        }
    }, [user]);

    return {
        challenges,
        updateChallengeProgress,
    };
};
