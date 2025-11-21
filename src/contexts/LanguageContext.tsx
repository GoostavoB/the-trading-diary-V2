import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage, 
  DEFAULT_LANGUAGE,
  getLanguageFromPath,
  getLocalizedPath 
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
  const { activeSubAccount } = useSubAccount();
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
      if (!user || !activeSubAccount || isInitialized) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('language')
          .eq('sub_account_id', activeSubAccount.id)
          .maybeSingle();

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
  }, [user, activeSubAccount]);

  // Sync with URL path changes
  useEffect(() => {
    const pathLang = getLanguageFromPath(location.pathname);
    if (pathLang !== language && !isLoading) {
      setLanguage(pathLang);
      i18n.changeLanguage(pathLang);
      localStorage.setItem('app-language', pathLang);
    }
  }, [location.pathname]);

  const changeLanguage = useCallback(async (newLang: SupportedLanguage, updateUrl: boolean = true) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) {
      console.error('Unsupported language:', newLang);
      return;
    }

    // Update state and i18n
    setLanguage(newLang);
    await i18n.changeLanguage(newLang);
    
    // Update localStorage
    localStorage.setItem('app-language', newLang);

    // Update database for authenticated users
    if (user && activeSubAccount) {
      try {
        await supabase
          .from('user_settings')
          .update({ language: newLang })
          .eq('sub_account_id', activeSubAccount.id);
      } catch (error) {
        console.error('Error saving language to database:', error);
      }
    }

    // Update URL if requested
    if (updateUrl) {
      const currentPath = location.pathname;
      const pathWithoutLang = currentPath.replace(/^\/(en|pt|es|ar|vi)/, '') || '/';
      const newPath = getLocalizedPath(pathWithoutLang, newLang);
      
      if (currentPath !== newPath) {
        navigate(newPath, { replace: true });
      }
    }
  }, [user, activeSubAccount, location.pathname, navigate]);

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
