import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { SupportedLanguage } from "@/utils/languageRouting";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
];

export const LanguageSelector = () => {
  const { language, changeLanguage } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode as SupportedLanguage);
    
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

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="gap-2"
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
