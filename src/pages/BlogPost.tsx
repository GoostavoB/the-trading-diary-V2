import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { blogArticles, getRelatedArticles } from '@/data/blogArticles';
import { MobileHeader } from '@/components/MobileHeader';
import Footer from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { ArrowLeft, Calendar, Clock, User, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { SEO } from '@/components/SEO';
import { addStructuredData, generateBreadcrumbSchema, generateHowToSchema } from '@/utils/seoHelpers';
import { useEffect } from 'react';
import { TableOfContents } from '@/components/TableOfContents';
import { useArticleTracking } from '@/hooks/useArticleTracking';

const BlogPost = () => {
  const { slug } = useParams();
  const article = blogArticles.find(a => a.slug === slug);

  // Track article reading behavior
  useArticleTracking({
    articleSlug: slug || '',
    articleTitle: article?.title || '',
    category: article?.category || '',
  });

  // SEO Meta Tags and Structured Data
  useEffect(() => {
    if (article) {
      // Article Schema with author URL
      const authorSlug = article.author.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.metaTitle || article.title,
        "description": article.metaDescription || article.description,
        "image": article.heroImage ? `https://www.thetradingdiary.com${article.heroImage}` : "https://www.thetradingdiary.com/og-image-en.png",
        "author": {
          "@type": "Person",
          "name": article.author,
          "url": `https://www.thetradingdiary.com/author/${authorSlug}`
        },
        "publisher": {
          "@type": "Organization",
          "name": "The Trading Diary",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.thetradingdiary.com/og-image-en.png"
          }
        },
        "datePublished": article.date,
        "dateModified": article.date,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": article.canonical || `https://www.thetradingdiary.com/blog/${article.slug}`
        },
        "keywords": article.tags?.join(", ") || article.focusKeyword || ""
      };

      addStructuredData(articleSchema, 'article-schema');

      // Breadcrumb Schema
      const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.thetradingdiary.com' },
        { name: 'Blog', url: 'https://www.thetradingdiary.com/blog' },
        { name: article.title, url: article.canonical || `https://www.thetradingdiary.com/blog/${article.slug}` }
      ]);

      addStructuredData(breadcrumbSchema, 'breadcrumb-schema');

      // Add HowTo Schema for tutorial articles
      if (article.category === 'Tools & AI' || article.category === 'Trading Strategies') {
        const headings = article.content.match(/^#{2,3}\s+(.+)$/gm) || [];
        if (headings.length >= 3) {
          const steps = headings.slice(0, 8).map(heading => {
            const text = heading.replace(/^#{2,3}\s+/, '');
            return {
              name: text,
              text: `Learn about ${text.toLowerCase()} in crypto trading.`
            };
          });

          const howToSchema = generateHowToSchema({
            title: article.title,
            description: article.description,
            image: article.heroImage ? `https://www.thetradingdiary.com${article.heroImage}` : undefined,
            steps
          });

          addStructuredData(howToSchema, 'howto-schema');
        }
      }

      // Add hreflang tags for language versions
      const languages = ['en', 'pt', 'es', 'ar', 'vi'];
      languages.forEach(lang => {
        const existingLink = document.querySelector(`link[hreflang="${lang}"]`);
        if (existingLink) existingLink.remove();

        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = lang;
        link.href = `https://www.thetradingdiary.com/blog/${article.slug}`;
        document.head.appendChild(link);
      });

      // Add social meta tags for better sharing
      const socialMeta = [
        { name: 'twitter:site', content: '@thetradingdiary' },
        { property: 'article:author', content: article.author },
        { property: 'article:published_time', content: article.date },
        { property: 'article:section', content: article.category },
        { property: 'article:tag', content: article.tags?.join(',') || article.focusKeyword || '' }
      ];

      socialMeta.forEach(meta => {
        const existingMeta = document.querySelector(
          meta.name ? `meta[name="${meta.name}"]` : `meta[property="${meta.property}"]`
        );
        if (existingMeta) existingMeta.remove();

        const metaTag = document.createElement('meta');
        if (meta.name) {
          metaTag.setAttribute('name', meta.name);
        } else {
          metaTag.setAttribute('property', meta.property);
        }
        metaTag.content = meta.content;
        document.head.appendChild(metaTag);
      });
    }
  }, [article]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <SEO
          title="Article Not Found"
          description="The article you are looking for does not exist."
          canonical="https://www.thetradingdiary.com/blog"
        />
        <SkipToContent />
        <MobileHeader />

        <main id="main-content" className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The article you're looking for doesn't exist.
            </p>
            <Link to="/blog">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const relatedArticles = getRelatedArticles(slug || '', 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <SEO
        title={article.metaTitle || article.title}
        description={article.metaDescription || article.description}
        canonical={article.canonical || `https://www.thetradingdiary.com/blog/${article.slug}`}
        keywords={article.focusKeyword}
        ogImage={article.heroImage ? `https://www.thetradingdiary.com${article.heroImage}` : undefined}
        ogType="article"
      />
      <SkipToContent />
      <MobileHeader />

      <main id="main-content" className="pt-20 pb-16 px-4">
        <article className="max-w-4xl mx-auto">
          {article.heroImage && (
            <img
              src={article.heroImage}
              alt={article.heroImageAlt || article.title}
              className="w-full h-64 object-cover rounded-lg mb-8"
            />
          )}

          <header className="mb-8">
            <Badge className="mb-4">{article.category}</Badge>
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(article.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{article.readTime}</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>

            <aside className="hidden lg:block">
              <TableOfContents content={article.content} />
            </aside>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <Button onClick={handleShare} variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share Article
            </Button>
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </article>

        {relatedArticles.length > 0 && (
          <section className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map(related => (
                <Link key={related.slug} to={`/blog/${related.slug}`}>
                  <Card className="h-full hover:border-primary transition-colors">
                    {related.heroImage && (
                      <img
                        src={related.heroImage}
                        alt={related.heroImageAlt || related.title}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                    )}
                    <div className="p-4">
                      <Badge className="mb-2">{related.category}</Badge>
                      <h3 className="font-semibold mb-2">{related.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {related.description}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="max-w-4xl mx-auto mt-8">
          <Link to="/blog">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
