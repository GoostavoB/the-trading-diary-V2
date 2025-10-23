import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface HreflangConfig {
  baseUrl?: string;
  languages: string[];
  defaultLanguage?: string;
}

/**
 * Hook to manage hreflang tags for multi-language SEO
 * Automatically adds and removes hreflang tags based on current route
 */
export const useHreflang = (config: HreflangConfig) => {
  const location = useLocation();
  const { 
    baseUrl = 'https://www.thetradingdiary.com',
    languages,
    defaultLanguage = 'en'
  } = config;

  useEffect(() => {
    // Remove existing hreflang tags
    const existingTags = document.querySelectorAll('link[hreflang]');
    existingTags.forEach(tag => tag.remove());

    // Get current path without language prefix
    const pathParts = location.pathname.split('/').filter(Boolean);
    const firstPart = pathParts[0];
    const isLangPath = languages.includes(firstPart);
    
    const basePath = isLangPath 
      ? '/' + pathParts.slice(1).join('/')
      : location.pathname;

    // Add hreflang for each language
    languages.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      
      if (lang === defaultLanguage) {
        link.href = `${baseUrl}${basePath}`;
      } else {
        link.href = `${baseUrl}/${lang}${basePath}`;
      }
      
      document.head.appendChild(link);
    });

    // Add x-default hreflang
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${baseUrl}${basePath}`;
    document.head.appendChild(defaultLink);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    
    const currentLang = isLangPath ? firstPart : defaultLanguage;
    canonical.href = currentLang === defaultLanguage 
      ? `${baseUrl}${basePath}`
      : `${baseUrl}/${currentLang}${basePath}`;

  }, [location, baseUrl, languages, defaultLanguage]);
};
