import { Card } from '@/components/ui/card';
import { Link, useParams } from 'react-router-dom';
import { PublicHeader } from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import { blogArticles, getArticlesByLanguage } from '@/data/blogArticles';
import { useTranslation } from '@/hooks/useTranslation';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { getLocalizedPath, getLanguageFromPath, type SupportedLanguage } from '@/utils/languageRouting';
import { useLocation } from 'react-router-dom';
import MetaTags from "@/components/SEO/MetaTags";
import SchemaMarkup from "@/components/SEO/SchemaMarkup";

const BlogCategory = () => {
  const { category, lang } = useParams();
  const location = useLocation();
  const { t, language } = useTranslation();
  
  // Get current language from URL or i18n
  const currentLang: SupportedLanguage = (lang as SupportedLanguage) || getLanguageFromPath(location.pathname);
  
  // Get articles for current language
  const languageArticles = useMemo(() => {
    const articles = getArticlesByLanguage(currentLang);
    return articles.length > 0 ? articles : getArticlesByLanguage('en');
  }, [currentLang]);
  
  // Filter by category
  const categoryArticles = useMemo(() => {
    if (!category) return languageArticles;
    return languageArticles.filter(article => 
      article.category.toLowerCase() === decodeURIComponent(category).toLowerCase()
    );
  }, [languageArticles, category]);
  
  const categoryName = category ? decodeURIComponent(category) : 'All Articles';
  
  return (
    <>
      <MetaTags
        title={`${categoryName} | Crypto Trading Blog`}
        description={`Read our ${categoryName} articles on crypto trading, AI-powered tools, and trading strategies.`}
        keywords={`crypto trading ${categoryName.toLowerCase()}, trading blog`}
      />
      <SchemaMarkup type="product" />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <SkipToContent />
        <PublicHeader />
        
        <main id="main-content" className="pt-28 pb-16 px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            <Link to={getLocalizedPath('/blog', currentLang)}>
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Articles
              </Button>
            </Link>
            
            <div className="text-center space-y-3">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {categoryName}
              </h1>
              <p className="text-lg text-muted-foreground">
                {categoryArticles.length} {categoryArticles.length === 1 ? 'article' : 'articles'}
              </p>
            </div>

            <div className="grid gap-6">
              {categoryArticles.map((article) => (
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
    </>
  );
};

export default BlogCategory;
