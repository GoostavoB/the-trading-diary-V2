import { useParams, Link, useLocation } from 'react-router-dom';
import { PublicHeader } from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { Clock, Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { getLanguageFromPath, getLocalizedPath, type SupportedLanguage } from '@/utils/languageRouting';
import { getArticleBySlug, getRelatedArticles } from '@/data/blogArticles';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import MetaTags from "@/components/SEO/MetaTags";
import SchemaMarkup, { createArticleSchema } from "@/components/SEO/SchemaMarkup";
import ReactMarkdown from 'react-markdown';

export default function BlogArticle() {
  const { slug, lang } = useParams<{ slug: string; lang?: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const currentLang: SupportedLanguage = (lang as SupportedLanguage) || getLanguageFromPath(location.pathname);
  
  const article = slug ? getArticleBySlug(slug) : null;
  const relatedArticles = slug ? getRelatedArticles(slug, 3) : [];

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <SkipToContent />
        <PublicHeader />
        
        <main id="main-content" className="pt-20 pb-16 px-4">
          <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist.</p>
            <Link to="/blog">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  const handleShare = async (platform?: 'twitter' | 'facebook' | 'linkedin') => {
    const url = window.location.href;
    const text = article.title;
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard",
      });
    }
  };

  const articleSchema = article ? createArticleSchema({
    title: article.title,
    description: article.metaDescription || article.description,
    image: article.heroImage ? `https://www.thetradingdiary.com${article.heroImage}` : 'https://www.thetradingdiary.com/og-image.png',
    author: article.author,
    datePublished: article.date,
    dateModified: article.date,
    url: window.location.href,
  }) : null;

  return (
    <>
      <MetaTags
        title={article.metaTitle || `${article.title} - The Trading Diary Blog`}
        description={article.metaDescription || article.description}
        keywords={article.tags?.join(', ') || ''}
        canonicalUrl={article.canonical}
      />
      {articleSchema && <SchemaMarkup type="article" data={articleSchema} />}

      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <SkipToContent />
        <PublicHeader />
        
        <main id="main-content" className="pt-28 pb-16 px-4">
          <article className="container max-w-4xl mx-auto px-4 py-12">
          <Link to={getLocalizedPath('/blog', currentLang)} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('blog.backToBlog', 'Back to Blog')}
          </Link>

          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(article.date).toLocaleDateString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.readTime}
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="h-4 w-4" />
                {article.author}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{article.title}</h1>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {article.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare()}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {article.heroImage && (
              <img 
                src={article.heroImage} 
                alt={article.heroImageAlt || article.title}
                className="w-full h-[400px] object-cover rounded-lg mb-8"
              />
            )}
          </header>

          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {/* Author Bio */}
          <div className="mb-12 p-6 bg-card border border-border rounded-lg">
            <h3 className="text-xl font-semibold mb-4">About the Author</h3>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold mb-1">{article.author}</p>
                <p className="text-sm text-muted-foreground">
                  Crypto trading expert with years of experience in developing AI-powered trading tools and strategies. 
                  Passionate about helping traders improve their performance through data-driven decision making.
                </p>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="border-t border-border pt-12">
              <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link 
                    key={related.slug} 
                    to={getLocalizedPath(`/blog/${related.slug}`, currentLang)}
                    className="group"
                  >
                    <Card className="p-4 h-full hover:border-primary/50 transition-all">
                      <Badge variant="secondary" className="text-xs mb-2">
                        {related.category}
                      </Badge>
                      <h4 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {related.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {related.readTime}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
