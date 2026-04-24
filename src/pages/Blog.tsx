import { Link, useParams } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import Footer from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { getArticlesByLanguage } from '@/data/blogArticles';
import { fetchArticlesByLanguage } from '@/services/blogService';
import { useTranslation } from '@/hooks/useTranslation';
import { SEO } from '@/components/SEO';
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { preloadImages } from '@/utils/preloadStrategies';
import { SUPPORTED_LANGUAGES, getLocalizedPath, getLanguageFromPath, type SupportedLanguage } from '@/utils/languageRouting';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';

const Blog = () => {
  const { lang } = useParams();
  const location = useLocation();
  const { t, language, changeLanguage } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get current language from URL or i18n
  const currentLang: SupportedLanguage = (lang && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage))
    ? (lang as SupportedLanguage)
    : getLanguageFromPath(location.pathname);

  // Update language if needed
  useEffect(() => {
    if (lang && lang !== language) {
      changeLanguage(lang as SupportedLanguage);
    }
  }, [lang, language, changeLanguage]);

  // Fetch articles from CMS (with static fallback built into the service)
  const { data: cmsArticles, isLoading } = useQuery({
    queryKey: ['blog-articles', currentLang],
    queryFn: () => fetchArticlesByLanguage(currentLang),
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  // Get articles for current language, fallback to English (static)
  const languageArticles = useMemo(() => {
    if (cmsArticles && cmsArticles.length > 0) return cmsArticles;
    const staticArticles = getArticlesByLanguage(currentLang);
    return staticArticles.length > 0 ? staticArticles : getArticlesByLanguage('en');
  }, [cmsArticles, currentLang]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(languageArticles.map(article => article.category));
    return ['all', ...Array.from(cats)];
  }, [languageArticles]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    return languageArticles.filter(article => {
      const matchesSearch = searchQuery === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [languageArticles, searchQuery, selectedCategory]);

  // Preload first 3 article hero images for faster navigation
  useEffect(() => {
    const topArticles = filteredArticles.slice(0, 3);
    const heroImages = topArticles
      .map(article => article.heroImage)
      .filter(Boolean) as string[];

    if (heroImages.length > 0) {
      preloadImages(heroImages);
    }
  }, [filteredArticles]);

  const formatReadableDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-space-900 text-space-100">
      <SEO
        title='Crypto Trading Blog | AI Tools, Strategies & Tips'
        description='Expert insights on crypto trading, AI-powered tools, trading psychology, risk management, and data-driven strategies. Learn from proven trading techniques.'
        canonical={`https://www.thetradingdiary.com${getLocalizedPath('/blog', currentLang)}`}
        keywords='crypto trading blog, AI trading tools, trading journal, trading psychology, risk management'
      />
      <SkipToContent />
      <MobileHeader />

      <main id="main-content" className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-gradient-hero tracking-tight">
              {t('blog.title', 'The Trading Diary Blog')}
            </h1>
            <p className="text-lg text-space-300 mt-4">
              {t('blog.subtitle', 'Expert insights on AI-powered trading, psychology, and risk management.')}
            </p>
          </div>

          {/* Controls row */}
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            {/* Search */}
            <div className="glass-thin rounded-ios flex items-center gap-2 px-3.5 h-11 md:w-80">
              <Search className="w-4 h-4 text-space-400 shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('blog.searchPlaceholder', 'Search articles...')}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-space-100 placeholder:text-space-400"
                aria-label="Search articles"
              />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 items-center">
              {categories.map((category) => {
                const active = selectedCategory === category;
                const label = category === 'all'
                  ? t('blog.allArticles', 'All')
                  : category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={active ? 'chip-electric text-xs' : 'chip text-xs text-space-300 hover:text-space-100'}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Articles grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-premium rounded-ios-card overflow-hidden animate-pulse">
                  <div className="aspect-[16/9] bg-space-700" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-16 bg-space-700 rounded-full" />
                    <div className="h-5 w-4/5 bg-space-700 rounded" />
                    <div className="h-3 w-full bg-space-700 rounded opacity-60" />
                    <div className="h-3 w-2/3 bg-space-700 rounded opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="card-premium rounded-ios-card p-10 text-center">
              <p className="text-space-200 text-base font-medium">No articles match your filters.</p>
              <p className="text-sm text-space-400 mt-1.5">Try clearing the search or selecting a different category.</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="btn-secondary h-10 px-4 text-sm mt-5 inline-flex"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Link
                  key={article.slug}
                  to={getLocalizedPath(`/blog/${article.slug}`, currentLang)}
                  className="card-premium rounded-ios-card overflow-hidden hover:shadow-premium-lg group transition-all animate-fade-in"
                >
                  {article.heroImage && (
                    <div className="aspect-[16/9] bg-space-700 overflow-hidden relative">
                      <img
                        src={article.heroImage}
                        alt={article.heroImageAlt || article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-space-900/30 to-transparent pointer-events-none" />
                    </div>
                  )}
                  <div className="p-5">
                    <span className="chip-electric text-xs mb-3 inline-flex">{article.category}</span>
                    <h2 className="font-display text-lg font-semibold text-space-100 mb-2 line-clamp-2 group-hover:text-electric-bright transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-sm text-space-300 line-clamp-3 mb-4 leading-relaxed">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-space-500/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-electric/15 border border-electric/25 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-medium text-electric">
                            {article.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-space-300 truncate">{article.author}</span>
                      </div>
                      <span className="text-xs text-space-400 shrink-0">
                        {article.readTime} · {formatReadableDate(article.date)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
