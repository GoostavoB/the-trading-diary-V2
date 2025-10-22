import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';
import { blogArticles, getRelatedArticles } from '@/data/blogArticles';
import { ArrowLeft, Calendar, Clock, User, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { usePageMeta } from '@/hooks/usePageMeta';
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
  
  // Update page meta
  usePageMeta(article ? {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.description,
    canonical: article.canonical || `https://www.thetradingdiary.com/blog/${article.slug}`,
    ogImage: article.heroImage ? `https://www.thetradingdiary.com${article.heroImage}` : undefined,
    keywords: article.focusKeyword
  } : {
    title: 'Article Not Found | The Trading Diary Blog',
    description: 'The article you are looking for does not exist.',
    canonical: 'https://www.thetradingdiary.com/blog'
  });

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (!article) {
    return (
      <AppLayout>
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
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-foreground">{article.title}</span>
        </nav>
        
        <Link to="/blog">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Button>
        </Link>

        <Card className="p-8 bg-card border-border">
          {/* Hero Image */}
          {article.heroImage && (
            <figure className="mb-8">
              <img 
                src={article.heroImage} 
                alt={article.heroImageAlt || article.title}
                className="w-full h-auto rounded-lg object-cover"
                width={1920}
                height={1080}
                loading="eager"
                fetchPriority="high"
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                {article.heroImageAlt || article.title}
              </figcaption>
            </figure>
          )}
          
          {/* Article Header */}
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              {article.category}
            </Badge>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              {article.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {article.description}
            </p>
            
            {/* Meta Information */}
            <div className="flex items-center justify-between border-t border-b border-border py-4">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link 
                  to={`/author/${article.author.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  {article.author}
                </Link>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {article.readTime}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h1: ({node, children, ...props}) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  return <h1 id={id} className="text-3xl font-bold mt-8 mb-4 scroll-mt-24" {...props}>{children}</h1>;
                },
                h2: ({node, children, ...props}) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  return <h2 id={id} className="text-2xl font-bold mt-6 mb-3 scroll-mt-24" {...props}>{children}</h2>;
                },
                h3: ({node, children, ...props}) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  return <h3 id={id} className="text-xl font-semibold mt-5 mb-2 scroll-mt-24" {...props}>{children}</h3>;
                },
                p: ({node, ...props}) => <p className="text-muted-foreground leading-relaxed mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="text-muted-foreground" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                code: ({node, ...props}) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props} />,
                pre: ({node, ...props}) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />,
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>
        </Card>

        {/* Related Articles Section */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
          <div className="grid gap-4">
            {getRelatedArticles(slug || '', 3).map((relatedArticle) => (
                <Link 
                  key={relatedArticle.slug} 
                  to={`/blog/${relatedArticle.slug}`}
                  className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {relatedArticle.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {relatedArticle.readTime}
                    </span>
                  </div>
                  <h4 className="font-semibold hover:text-primary transition-colors">
                    {relatedArticle.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {relatedArticle.description}
                  </p>
                </Link>
              ))}
          </div>
        </Card>
          </div>
          
          {/* Table of Contents Sidebar */}
          <aside className="hidden lg:block">
            <TableOfContents content={article.content} />
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default BlogPost;
