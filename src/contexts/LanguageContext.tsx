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
  
  // Initialize from i18n.language (already set by i18n.ts during initialization)
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const i18nLang = i18n.language as SupportedLanguage;
    if (SUPPORTED_LANGUAGES.includes(i18nLang)) {
      console.log(`[LanguageProvider] Initialized from i18n: ${i18nLang}`);
      return i18nLang;
    }
    console.log('[LanguageProvider] Fallback to en');
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
    // English-only: Always use 'en', no-op for other languages
    if (newLang !== 'en') {
      console.log('English-only mode: ignoring language change request');
      return;
    }

    console.log(`Language set to: ${newLang}`);
    
    setIsLoading(true);
    setLanguage('en');
    await i18n.changeLanguage('en');
    localStorage.setItem('app-language', 'en');

    // Update database for authenticated users
    if (user) {
      try {
        await supabase
          .from('user_settings')
          .update({ language: 'en' })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving language to database:', error);
      }
    }

    setIsLoading(false);
  }, [user]);

  // URL sync is no longer needed - i18n.ts handles initialization from URL

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
