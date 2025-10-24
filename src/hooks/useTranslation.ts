import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Custom hook for translations with simplified API
 * Now integrated with LanguageContext for database persistence
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  const { language, changeLanguage: contextChangeLanguage } = useLanguage();
  
  return {
    t,
    i18n,
    language,
    changeLanguage: contextChangeLanguage,
  };
};
