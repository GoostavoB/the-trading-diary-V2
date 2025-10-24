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

  // Ensure the current path is valid for the selected language
  useEffect(() => {
    const pathLanguage = getLanguageFromPath(location.pathname);
    
    // If path doesn't match current language, update the URL
    if (pathLanguage !== language) {
      const basePath = getPathWithoutLanguage(location.pathname);
      const newPath = getLocalizedPath(basePath, language);
      
      console.log(`Redirecting to localized path: ${newPath}`);
      // Use replace to avoid adding to history
      navigate(newPath, { replace: true });
    }
  }, [language]);

  return null; // This component doesn't render anything
};
