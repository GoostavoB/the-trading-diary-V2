import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { SupportedLanguage } from "@/utils/languageRouting";

const languages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];

export const LanguageToggle = () => {
  const { language, changeLanguage: i18nChangeLanguage } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18nChangeLanguage(langCode as SupportedLanguage);
    localStorage.setItem('app-language', langCode);
    
    // Get current path without existing language prefix
    const currentPath = location.pathname;
    const pathParts = currentPath.split('/').filter(Boolean);
    const isLangPath = ['en', 'pt', 'es', 'ar', 'vi'].includes(pathParts[0]);
    
    // Remove language prefix if it exists
    const pathWithoutLang = isLangPath 
      ? '/' + pathParts.slice(1).join('/') 
      : currentPath;
    
    // Build new path with language prefix (except for 'en' which stays at root)
    const basePath = pathWithoutLang || '/';
    const newPath = langCode === 'en' ? basePath : `/${langCode}${basePath}`;
    
    navigate(newPath, { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9 hover:bg-accent/50 transition-colors"
          aria-label="Select language"
        >
          <span className="text-xl" role="img" aria-label={currentLanguage.name}>
            {currentLanguage.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[180px] glass-strong backdrop-blur-xl border-border/50"
      >
      {languages.map((lang) => (
        <DropdownMenuItem
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={cn(
            "flex items-center justify-between cursor-pointer",
            language === lang.code && "bg-accent/50"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg" role="img" aria-label={lang.name}>
              {lang.flag}
            </span>
            <span>{lang.name}</span>
          </div>
          {language === lang.code && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </DropdownMenuItem>
      ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
