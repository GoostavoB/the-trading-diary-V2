/**
 * Utility functions for language-aware routing
 */

export const SUPPORTED_LANGUAGES = ['en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

/**
 * Public routes that should have language prefixes in URLs
 */
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/pricing',
  '/contact',
  '/legal',
  '/terms',
  '/privacy',
  '/blog',
  '/about',
  '/sitemap',
  '/seo-dashboard',
  '/logo-download',
  '/logo-generator',
  '/crypto-trading-faq',
  '/testimonials',
  '/changelog',
  '/how-it-works',
  '/features',
  '/cookie-policy',
  '/learn',
];

/**
 * Check if a route is public (should have language prefix)
 */
export const isPublicRoute = (pathname: string): boolean => {
  const basePath = getPathWithoutLanguage(pathname);
  return PUBLIC_ROUTES.some(route => 
    basePath === route || 
    basePath.startsWith(`${route}/`) ||
    basePath.startsWith('/blog/') ||
    basePath.startsWith('/author/')
  );
};

/**
 * Get the current language from the URL path
 * For protected routes, returns DEFAULT_LANGUAGE since they don't use URL prefixes
 */
export const getLanguageFromPath = (pathname: string): SupportedLanguage => {
  const firstSegment = pathname.split('/')[1];
  const urlLang = SUPPORTED_LANGUAGES.includes(firstSegment as SupportedLanguage)
    ? (firstSegment as SupportedLanguage)
    : null;
  
  // For protected routes, ignore URL language prefix
  if (!isPublicRoute(pathname)) {
    return DEFAULT_LANGUAGE;
  }
  
  return urlLang || DEFAULT_LANGUAGE;
};

/**
 * Get the path without language prefix
 */
export const getPathWithoutLanguage = (pathname: string): string => {
  const firstSegment = pathname.split('/')[1];
  const hasLangPrefix = SUPPORTED_LANGUAGES.includes(firstSegment as SupportedLanguage);
  
  if (!hasLangPrefix) return pathname;
  return pathname.replace(`/${firstSegment}`, '') || '/';
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
