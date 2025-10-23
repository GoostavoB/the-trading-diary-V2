/**
 * Utility functions for language-aware routing
 */

export const SUPPORTED_LANGUAGES = ['en', 'pt', 'es', 'ar', 'vi'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

/**
 * Get the current language from the URL path
 */
export const getLanguageFromPath = (pathname: string): SupportedLanguage => {
  const firstSegment = pathname.split('/')[1];
  return SUPPORTED_LANGUAGES.includes(firstSegment as SupportedLanguage)
    ? (firstSegment as SupportedLanguage)
    : DEFAULT_LANGUAGE;
};

/**
 * Get the path without language prefix
 */
export const getPathWithoutLanguage = (pathname: string): string => {
  const lang = getLanguageFromPath(pathname);
  if (lang === DEFAULT_LANGUAGE) return pathname;
  return pathname.replace(`/${lang}`, '') || '/';
};

/**
 * Add language prefix to a path
 */
export const getLocalizedPath = (path: string, lang: SupportedLanguage): string => {
  if (lang === DEFAULT_LANGUAGE) return path;
  
  // Remove trailing slash from path
  const cleanPath = path.endsWith('/') && path.length > 1 
    ? path.slice(0, -1) 
    : path;
  
  return `/${lang}${cleanPath}`;
};

/**
 * Generate alternate language URLs for a given path
 */
export const getAlternateLanguageUrls = (
  path: string, 
  baseUrl: string = 'https://www.thetradingdiary.com'
): Record<SupportedLanguage | 'x-default', string> => {
  const basePath = getPathWithoutLanguage(path);
  
  const urls: Record<string, string> = {
    'x-default': `${baseUrl}${basePath}`,
  };
  
  SUPPORTED_LANGUAGES.forEach(lang => {
    urls[lang] = lang === DEFAULT_LANGUAGE
      ? `${baseUrl}${basePath}`
      : `${baseUrl}/${lang}${basePath}`;
  });
  
  return urls;
};

/**
 * Get language-specific blog hero image
 */
export const getLocalizedBlogHero = (baseImage: string, lang: SupportedLanguage): string => {
  if (!baseImage || lang === DEFAULT_LANGUAGE) return baseImage;
  
  // Replace the file extension with language-specific version
  // e.g., /blog/hero.png -> /blog/hero-pt.png
  const parts = baseImage.split('.');
  const extension = parts.pop();
  const baseName = parts.join('.');
  
  return `${baseName}-${lang}.${extension}`;
};
