import { useUserTier, UserTier } from './useUserTier';
import { useUpgradeModal } from '@/contexts/UpgradeModalContext';
import { ThemeTier, isThemeUnlocked, getThemeById } from '@/utils/unifiedThemes';

const CUSTOM_THEME_LIMITS: Record<UserTier, number> = {
  free: 0,
  basic: 0,
  pro: 5,
  elite: 10,
};

export const useThemeGating = () => {
  const { tier, isLoading } = useUserTier();
  const { openModal } = useUpgradeModal();

  // Map UserTier to ThemeTier for theme access
  const themeTier: ThemeTier = tier as ThemeTier;

  const canAccessTheme = (themeId: string): boolean => {
    const theme = getThemeById(themeId);
    if (!theme) return false;
    return isThemeUnlocked(theme, themeTier);
  };

  const canCreateCustomTheme = (currentCount: number): boolean => {
    const limit = CUSTOM_THEME_LIMITS[tier];
    return currentCount < limit;
  };

  const canAccessBackgroundColor = (): boolean => {
    return tier === 'elite';
  };

  const getCustomThemeLimit = (): number => {
    return CUSTOM_THEME_LIMITS[tier];
  };

  const handleLockedTheme = (themeId: string) => {
    const theme = getThemeById(themeId);
    if (!theme) return;

    const requiredPlan = theme.requiredTier === 'pro' || theme.requiredTier === 'elite' 
      ? theme.requiredTier 
      : 'pro';

    openModal({
      source: 'theme_locked',
      requiredPlan,
      title: 'Unlock Premium Themes',
      message: requiredPlan === 'pro'
        ? 'Use every theme. Save five custom themes.'
        : 'Unlimited custom themes. Choose any background color.',
      illustration: 'palette',
    });
  };

  const handleLockedCustomTheme = () => {
    const requiredPlan = tier === 'free' || tier === 'basic' ? 'pro' : 'elite';
    
    openModal({
      source: 'custom_theme_locked',
      requiredPlan,
      title: tier === 'free' || tier === 'basic' ? 'Create Custom Themes' : 'Unlimited Custom Themes',
      message: requiredPlan === 'pro'
        ? 'Save five custom themes with Pro.'
        : 'Create unlimited custom themes with Elite.',
      illustration: 'palette',
    });
  };

  const handleLockedBackgroundColor = () => {
    openModal({
      source: 'background_color_locked',
      requiredPlan: 'elite',
      title: 'Background Color Control',
      message: 'Unlimited custom themes. Choose any background color.',
      illustration: 'palette',
    });
  };

  return {
    tier: themeTier,
    isLoading,
    canAccessTheme,
    canCreateCustomTheme,
    canAccessBackgroundColor,
    customThemeLimit: getCustomThemeLimit(),
    handleLockedTheme,
    handleLockedCustomTheme,
    handleLockedBackgroundColor,
  };
};
