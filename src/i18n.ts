// src/i18n.ts
// REVISED VERSION - Initialize from URL, not localStorage

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en/translation.json';
import { type SupportedLanguage } from './utils/languageRouting';

const supportedLanguages: SupportedLanguage[] = ['en'];

// English-only configuration
function getInitialLanguage(): SupportedLanguage {
  return 'en';
}

const initialLanguage = getInitialLanguage();

// Initialize i18n and wait for it to be ready
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .then(() => {
    console.log(`[i18n] ✅ Initialized with language: ${i18n.language}`);
  });

// Development helper: Log missing keys
if (import.meta.env.DEV) {
  i18n.on('missingKey', (lngs, namespace, key, res) => {
    console.warn(`[i18n] Missing translation key: "${key}" for languages: ${lngs.join(', ')}`);
  });
}

export default i18n;
