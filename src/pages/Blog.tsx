import { Card } from '@/components/ui/card';
import { Link, useParams } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import Footer from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Search } from 'lucide-react';
import { blogArticles, getArticlesByLanguage } from '@/data/blogArticles';
import { useTranslation } from '@/hooks/useTranslation';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { preloadImages } from '@/utils/preloadStrategies';
import { useHreflang } from '@/hooks/useHreflang';
import { SUPPORTED_LANGUAGES, getLocalizedPath, getLanguageFromPath, type SupportedLanguage } from '@/utils/languageRouting';
import { useLocation } from 'react-router-dom';
import { addStructuredData } from '@/utils/seoHelpers';

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
  
  // Add hreflang tags for SEO
  useHreflang({
    languages: [...SUPPORTED_LANGUAGES],
    defaultLanguage: 'en'
  });
  
  // Update language if needed
  useEffect(() => {
    if (lang && lang !== language) {
      changeLanguage(lang as SupportedLanguage);
    }
  }, [lang, language, changeLanguage]);
  
  // SEO Meta
  usePageMeta({
    title: 'Crypto Trading Blog | AI Tools, Strategies & Tips',
    description: 'Expert insights on crypto trading, AI-powered tools, trading psychology, risk management, and data-driven strategies. Learn from proven trading techniques.',
    canonical: `https://www.thetradingdiary.com${getLocalizedPath('/blog', currentLang)}`,
    keywords: 'crypto trading blog, AI trading tools, trading journal, trading psychology, risk management'
  });

  // Add FAQ schema for blog landing page
  useEffect(() => {
    addStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What topics does The Trading Diary blog cover?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Trading Diary blog covers crypto trading strategies, AI-powered trading tools, trading psychology, risk management, technical analysis, market trends, exchange comparisons, beginner guides, and data-driven trading techniques. All content is written by experienced traders and crypto experts."
          }
        },
        {
          "@type": "Question",
          "name": "How often is the blog updated?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Trading Diary blog is updated 2-3 times per week with fresh content on crypto trading, market analysis, tool reviews, and educational guides. Subscribe to our newsletter to get notified when new articles are published."
          }
        },
        {
          "@type": "Question",
          "name": "Are the blog articles written by real traders?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! All blog articles are written by experienced cryptocurrency traders with years of hands-on trading experience. Our authors share real strategies, lessons learned from actual trades, and practical tips based on proven results."
          }
        },
        {
          "@type": "Question",
          "name": "Can I learn crypto trading from The Trading Diary blog?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Our blog offers comprehensive beginner guides, step-by-step tutorials, risk management strategies, psychology tips, and advanced trading techniques. Whether you're a beginner or experienced trader, you'll find actionable insights to improve your trading skills."
          }
        },
        {
          "@type": "Question",
          "name": "Do you review crypto trading tools and platforms?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. The Trading Diary blog includes in-depth reviews and comparisons of crypto trading journals, analytics platforms, exchanges, and trading tools. We provide honest, unbiased reviews based on real testing and user feedback to help you choose the best tools for your trading needs."
          }
        }
      ]
    }, 'blog-faq-schema');
  }, []);

  // Get articles for current language, fallback to English
  const languageArticles = useMemo(() => {
    const articles = getArticlesByLanguage(currentLang);
    return articles.length > 0 ? articles : getArticlesByLanguage('en');
  }, [currentLang]);
  
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
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <SkipToContent />
      <MobileHeader />
      
      <main id="main-content" className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('blog.title', 'Crypto Trading Blog')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('blog.subtitle', 'Expert insights on AI-powered trading')}
          </p>
        </div>
        
        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('blog.searchPlaceholder', 'Search articles...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? t('blog.allArticles') : category}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Articles Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
        </p>

        <div className="grid gap-6">
          {filteredArticles.map((article) => (
            <Link to={getLocalizedPath(`/blog/${article.slug}`, currentLang)} key={article.slug}>
              <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-lg">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {article.author}
                        </span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-muted-foreground line-clamp-2">{article.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Blog;
