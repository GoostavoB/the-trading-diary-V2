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

  const formatLogDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return iso;
    }
  };

  const slugifyCat = (c: string) =>
    c.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');

  return (
    <div className="min-h-screen bg-void text-phosphor">
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
          {/* Sticky terminal bar */}
          <div className="term-header sticky top-20 z-20 mb-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-phosphor font-mono text-xs sm:text-sm">
              ./blog --sort=recent --filter={selectedCategory} --lang={currentLang}
            </span>
            <span className="flex items-center gap-2">
              <span className={`pulse-dot ${isLoading ? 'amber' : ''}`} />
              <span className={`status-pill ${isLoading ? 'amber' : ''}`}>
                {isLoading ? '[LOADING]' : '[READY]'}
              </span>
            </span>
          </div>

          {/* Scan bar beneath header */}
          <div className="scan-bar h-[2px] mb-8" />

          {/* Title banner */}
          <div className="mb-8 animate-fade-in">
            <h1
              className="font-display uppercase text-4xl sm:text-5xl tracking-wider glow-text glitch"
              data-text={t('blog.title', 'Crypto Trading Blog')}
            >
              {t('blog.title', 'Crypto Trading Blog')}
            </h1>
            <p className="text-phosphor-dim font-mono text-sm mt-3">
              <span className="text-amber-term">// </span>
              {t('blog.subtitle', 'Expert insights on AI-powered trading')}
            </p>
          </div>

          {/* Grid: sidebar + log */}
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
            {/* Sidebar: categories + grep */}
            <aside className="space-y-6">
              <div className="term-card p-0 overflow-hidden">
                <div className="term-header text-xs">CATEGORIES</div>
                <ul className="py-2 font-mono text-sm">
                  {categories.map((category) => {
                    const active = selectedCategory === category;
                    return (
                      <li key={category}>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={[
                            'w-full text-left px-3 py-1.5 flex items-center gap-2',
                            'transition-colors duration-150',
                            active
                              ? 'text-amber-term glow-text-amber'
                              : 'text-phosphor-dim hover:text-phosphor hover:bg-phosphor-dim',
                          ].join(' ')}
                        >
                          <span className={active ? 'text-amber-term' : 'opacity-40'}>
                            {active ? '▸' : ' '}
                          </span>
                          <span className="truncate">
                            {category === 'all'
                              ? t('blog.allArticles', 'all')
                              : category.toLowerCase()}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* grep input */}
              <div className="term-card p-0 overflow-hidden">
                <div className="term-header text-xs">SEARCH</div>
                <div className="p-3">
                  <label className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-amber-term">&#10071; grep</span>
                  </label>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-phosphor-dim font-mono">&gt;</span>
                    <input
                      type="search"
                      placeholder="pattern..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-carbon border border-phosphor-dim text-phosphor font-mono px-2 py-1 text-sm outline-none focus:border-phosphor focus:shadow-phosphor placeholder:text-phosphor-dim"
                    />
                  </div>
                </div>
              </div>

              {/* Stats panel */}
              <div className="hud-panel p-4 font-mono text-xs">
                <div className="text-phosphor-dim">ENTRIES</div>
                <div className="text-2xl text-phosphor glow-text mt-1">
                  {String(filteredArticles.length).padStart(3, '0')}
                </div>
                <div className="mt-3 text-phosphor-dim">
                  TOTAL: <span className="text-cyan-term">{languageArticles.length}</span>
                </div>
                <div className="text-phosphor-dim">
                  LANG: <span className="text-cyan-term uppercase">{currentLang}</span>
                </div>
              </div>
            </aside>

            {/* Log list */}
            <section>
              <div className="mb-4 font-mono text-xs text-phosphor-dim flex items-center gap-2">
                <span className="text-amber-term">$</span>
                <span className="cursor-blink">
                  cat ./posts/*.md | filter --cat={selectedCategory}
                  {searchQuery ? ` --grep="${searchQuery}"` : ''}
                </span>
              </div>

              <div className="term-card p-0 overflow-hidden">
                <div className="term-header flex items-center justify-between">
                  <span>posts.log</span>
                  <span className="text-phosphor-dim">
                    {isLoading
                      ? 'loading...'
                      : `${filteredArticles.length} ${filteredArticles.length === 1 ? 'entry' : 'entries'}`}
                  </span>
                </div>

                <div className="p-2 sm:p-4 font-mono text-sm">
                  {isLoading && (
                    <div className="space-y-4 py-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2 animate-pulse">
                          <div className="h-3 w-3/4 bg-phosphor-dim" />
                          <div className="h-2 w-1/2 bg-phosphor-dim opacity-50" />
                          <div className="border-t border-phosphor-dim/30" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!isLoading && filteredArticles.length === 0 && (
                    <div className="py-10 text-center text-phosphor-dim">
                      <span className="text-danger">!</span> no entries match current filter
                      <div className="mt-2 text-xs">
                        try: <span className="text-cyan-term">clear</span> or adjust --filter
                      </div>
                    </div>
                  )}

                  {!isLoading && filteredArticles.map((article, idx) => {
                    const date = formatLogDate(article.date);
                    const cat = slugifyCat(article.category);
                    return (
                      <div key={article.slug}>
                        <Link
                          to={getLocalizedPath(`/blog/${article.slug}`, currentLang)}
                          className="group block py-4 px-2 sm:px-3 hover:bg-phosphor-dim transition-colors duration-150 relative"
                        >
                          {/* Meta line */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-phosphor-dim">
                            <span className="text-amber-term">[{date}]</span>
                            <span className="text-cyan-term">CAT_{cat}</span>
                            <span className="text-phosphor-dim">&#9474;</span>
                            <span className="text-phosphor">{article.readTime}</span>
                            <span className="text-phosphor-dim">&#9474;</span>
                            <span className="text-phosphor-dim">
                              by <span className="text-phosphor">{article.author}</span>
                            </span>
                          </div>

                          {/* Title line */}
                          <div className="mt-2 flex items-start gap-2">
                            <span className="text-amber-term select-none">&gt;</span>
                            <h2
                              className="text-base sm:text-lg text-phosphor group-hover:text-amber-term group-hover:glow-text-amber transition-colors font-display uppercase tracking-wide glitch"
                              data-text={article.title}
                            >
                              {article.title}
                            </h2>
                          </div>

                          {/* Description */}
                          <div className="mt-1 flex items-start gap-2 text-phosphor-dim">
                            <span className="text-phosphor-dim select-none">//</span>
                            <p className="line-clamp-2 text-sm">{article.description}</p>
                          </div>

                          {/* Tags */}
                          {article.tags && article.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1 text-xs">
                              {article.tags.slice(0, 5).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-cyan-term before:content-['#'] before:opacity-60"
                                >
                                  {tag.replace(/\s+/g, '_').toLowerCase()}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Hover scan beam */}
                          <span
                            aria-hidden
                            className="absolute inset-x-0 top-0 h-[1px] bg-phosphor opacity-0 group-hover:opacity-80 transition-opacity"
                          />
                        </Link>

                        {idx < filteredArticles.length - 1 && (
                          <div className="border-t border-dashed border-phosphor-dim/40" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="term-header text-xs border-t-0">
                  <span className="text-phosphor-dim">EOF</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
