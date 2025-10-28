// src/components/LanguageToggle.tsx
// REVISED VERSION - Uses centralized changeLanguage only

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import type { SupportedLanguage } from '../utils/languageRouting';

interface Language {
  code: SupportedLanguage;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export const LanguageToggle = () => {
  const { language, changeLanguage, isLoading } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  // ===================================================================
  // FIX: Use centralized changeLanguage ONLY
  // Remove manual localStorage and navigation - let context handle it
  // ===================================================================
  const handleLanguageChange = async (langCode: SupportedLanguage) => {
    if (langCode === language) {
      setIsOpen(false);
      return;
    }

    console.log(`[LanguageToggle] Changing language to: ${langCode}`);
    
    try {
      // ✅ Call centralized changeLanguage with updateUrl=true
      // This handles: state, i18n, localStorage, URL navigation, everything
      await changeLanguage(langCode, true);
      
      setIsOpen(false);
      console.log(`[LanguageToggle] ✅ Language changed successfully`);
    } catch (error) {
      console.error('[LanguageToggle] ❌ Language change failed:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50 min-w-[200px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isLoading}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors disabled:opacity-50 ${
                lang.code === language ? 'bg-gray-700/50' : ''
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{lang.name}</div>
                <div className="text-xs text-gray-400">{lang.code.toUpperCase()}</div>
              </div>
              {lang.code === language && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
