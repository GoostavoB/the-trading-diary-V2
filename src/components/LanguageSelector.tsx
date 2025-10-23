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
    changeLanguage(langCode);
    
    // Update URL with language prefix
    const currentPath = location.pathname;
    const pathWithoutLang = currentPath.replace(/^\/(en|pt|es|ar|vi)/, '');
    const newPath = langCode === 'en' ? pathWithoutLang || '/' : `/${langCode}${pathWithoutLang || '/'}`;
    navigate(newPath);
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
