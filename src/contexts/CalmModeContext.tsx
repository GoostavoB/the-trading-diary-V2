import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CalmModeContextType {
  calmModeEnabled: boolean;
  soundEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  toggleCalmMode: () => void;
  toggleSound: () => void;
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
}

const CalmModeContext = createContext<CalmModeContextType | undefined>(undefined);

export const CalmModeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [calmModeEnabled, setCalmModeEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animationSpeed, setAnimationSpeedState] = useState<'slow' | 'normal' | 'fast'>('normal');

  useEffect(() => {
    if (!user) return;

    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from('user_customization_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching preferences:', error);
        return;
      }

      if (data) {
        setCalmModeEnabled(data.calm_mode_enabled);
        setSoundEnabled(data.sound_enabled);
        setAnimationSpeedState(data.animation_speed as 'slow' | 'normal' | 'fast');
      } else {
        // Initialize preferences for new user
        await supabase
          .from('user_customization_preferences')
          .insert({
            user_id: user.id,
            calm_mode_enabled: false,
            sound_enabled: true,
            animation_speed: 'normal',
          });
      }
    };

    fetchPreferences();
  }, [user]);

  const toggleCalmMode = async () => {
    if (!user) return;
    
    const newValue = !calmModeEnabled;
    setCalmModeEnabled(newValue);

    await supabase
      .from('user_customization_preferences')
      .update({ calm_mode_enabled: newValue })
      .eq('user_id', user.id);
  };

  const toggleSound = async () => {
    if (!user) return;
    
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);

    await supabase
      .from('user_customization_preferences')
      .update({ sound_enabled: newValue })
      .eq('user_id', user.id);
  };

  const setAnimationSpeed = async (speed: 'slow' | 'normal' | 'fast') => {
    if (!user) return;
    
    setAnimationSpeedState(speed);

    await supabase
      .from('user_customization_preferences')
      .update({ animation_speed: speed })
      .eq('user_id', user.id);
  };

  return (
    <CalmModeContext.Provider value={{
      calmModeEnabled,
      soundEnabled,
      animationSpeed,
      toggleCalmMode,
      toggleSound,
      setAnimationSpeed,
    }}>
      {children}
    </CalmModeContext.Provider>
  );
};

export const useCalmMode = () => {
  const context = useContext(CalmModeContext);
  if (!context) {
    throw new Error('useCalmMode must be used within CalmModeProvider');
  }
  return context;
};
