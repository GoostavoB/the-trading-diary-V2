import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/contexts/AuthContext';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage, 
  DEFAULT_LANGUAGE,
  getLanguageFromPath,
  getLocalizedPath,
  isPublicRoute,
  getPathWithoutLanguage
} from '@/utils/languageRouting';

interface LanguageContextType {
  language: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage, updateUrl?: boolean) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    // Priority: URL path > localStorage > browser > default
    const pathLang = getLanguageFromPath(location.pathname);
    if (pathLang !== DEFAULT_LANGUAGE) return pathLang;
    
    const stored = localStorage.getItem('app-language');
    if (stored) {
      // Normalize to base language code (e.g., 'en-US' -> 'en')
      const base = stored.split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(base as SupportedLanguage)) {
        return base as SupportedLanguage;
      }
    }
    
    return DEFAULT_LANGUAGE;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load language from database for authenticated users
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user || isInitialized) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('language')
          .eq('user_id', user.id)
          .single();

        if (!error && data?.language) {
          const dbLang = data.language as SupportedLanguage;
          if (SUPPORTED_LANGUAGES.includes(dbLang)) {
            await changeLanguage(dbLang, false);
          }
        }
      } catch (error) {
        console.error('Error loading user language:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadUserLanguage();
  }, [user]);

  // Cleanup: redirect protected routes with language prefix to base path
  useEffect(() => {
    const pathLang = getLanguageFromPath(location.pathname);
    const firstSegment = location.pathname.split('/')[1];
    const hasLangPrefix = SUPPORTED_LANGUAGES.includes(firstSegment as SupportedLanguage);
    
    // If on protected route with language prefix, clean it up
    if (!isPublicRoute(location.pathname) && hasLangPrefix) {
      const basePath = getPathWithoutLanguage(location.pathname);
      console.log(`Cleaning up language prefix from protected route: ${basePath}`);
      
      // Set the language from URL before redirecting
      if (pathLang !== language) {
        setLanguage(pathLang);
        i18n.changeLanguage(pathLang);
        localStorage.setItem('app-language', pathLang);
      }
      
      navigate(basePath, { replace: true });
    }
  }, [location.pathname, navigate, language]);

  const changeLanguage = useCallback(async (newLang: SupportedLanguage, updateUrl: boolean = true) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) {
      console.error('Unsupported language:', newLang);
      return;
    }

    console.log(`Changing language to: ${newLang}, updateURL: ${updateUrl}`);
    
    // Set loading state during language change
    setIsLoading(true);

    // Update state and i18n
    setLanguage(newLang);
    await i18n.changeLanguage(newLang);
    
    // Update localStorage
    localStorage.setItem('app-language', newLang);

    // Update database for authenticated users
    if (user) {
      try {
        await supabase
          .from('user_settings')
          .update({ language: newLang })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving language to database:', error);
      }
    }

    // Update URL if requested (only for public routes)
    if (updateUrl && isPublicRoute(location.pathname)) {
      const currentPath = location.pathname;
      const pathWithoutLang = currentPath.replace(/^\/(en|pt|es|ar|vi)/, '') || '/';
      const newPath = getLocalizedPath(pathWithoutLang, newLang);
      
      if (currentPath !== newPath) {
        navigate(newPath, { replace: true });
      }
    }
    // For protected routes, language change happens via state only (no URL update)
    
    // Clear loading state after everything is complete
    setIsLoading(false);
  }, [user, location.pathname, navigate]);

  // Sync with URL path changes (only for public routes)
  useEffect(() => {
    if (!isPublicRoute(location.pathname)) return;
    
    const pathLang = getLanguageFromPath(location.pathname);
    if (pathLang !== language) {
      // Call the proper changeLanguage function which handles loading state
      changeLanguage(pathLang, false);
    }
  }, [location.pathname, language, changeLanguage]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
