import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { getLanguageFromPath, getPathWithoutLanguage, getLocalizedPath } from '@/utils/languageRouting';

/**
 * Component to sync i18n language with URL path
 * Ensures that the language state stays in sync with the current route
 * Prevents 404 errors when switching languages
 */
export const LanguageSync = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, changeLanguage } = useTranslation();

  useEffect(() => {
    const pathLanguage = getLanguageFromPath(location.pathname);
    
    // Only change if different from current language
    if (pathLanguage !== language) {
      console.log(`Syncing language from ${language} to ${pathLanguage}`);
      // Avoid URL update here to prevent redirect loops; URL handled below
      changeLanguage(pathLanguage, false);
    }
  }, [location.pathname, language, changeLanguage]);

  // NOTE: the URL is the single source of truth for language.
  // A previous effect redirected the URL to match the language state, which
  // fought with the effect above and caused a PT/EN flicker loop on /pt/* routes.


  return null; // This component doesn't render anything
};
