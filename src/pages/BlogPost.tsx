import { useParams, Link } from 'react-router-dom';
import { getRelatedArticles } from '@/data/blogArticles';
import { fetchArticleBySlug } from '@/services/blogService';
import { MobileHeader } from '@/components/MobileHeader';
import Footer from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { SEO } from '@/components/SEO';
import { addStructuredData, generateBreadcrumbSchema, generateHowToSchema } from '@/utils/seoHelpers';
import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useArticleTracking } from '@/hooks/useArticleTracking';
import { Share2, Copy, Twitter, ChevronLeft } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const slugifyHeading = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const BlogPost = () => {
  const { slug } = useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => fetchArticleBySlug(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

  // Track article reading behavior
  useArticleTracking({
    articleSlug: slug || '',
    articleTitle: article?.title || '',
    category: article?.category || '',
  });

  // TOC + reading progress state
  const [activeId, setActiveId] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const tocItems: TocItem[] = useMemo(() => {
    if (!article?.content) return [];
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;
    while ((match = headingRegex.exec(article.content)) !== null) {
      items.push({
        id: slugifyHeading(match[2]),
        text: match[2],
        level: match[1].length,
      });
    }
    return items;
  }, [article?.content]);

  // Intersection observer for active heading
  useEffect(() => {
    if (tocItems.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );
    const timer = setTimeout(() => {
      tocItems.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 150);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [tocItems]);

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      const pct = height > 0 ? Math.min(100, Math.max(0, (scrolled / height) * 100)) : 0;
      setProgress(pct);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [article]);

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

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: article?.title });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleTwitterShare = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(article?.title || '');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const formatReadableDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-space-900 text-space-100">
        <SkipToContent />
        <MobileHeader />
        <main id="main-content" className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="h-4 w-40 bg-space-700 rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-space-700 rounded animate-pulse" />
            <div className="h-5 w-1/2 bg-space-700 rounded animate-pulse opacity-60" />
            <div className="aspect-[16/9] bg-space-700 rounded-ios-card animate-pulse mt-6" />
            <div className="space-y-2.5 mt-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-3 bg-space-700 opacity-50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-space-900 text-space-100">
        <SEO
          title="Article Not Found"
          description="The article you are looking for does not exist."
          canonical="https://www.thetradingdiary.com/blog"
        />
        <SkipToContent />
        <MobileHeader />

        <main id="main-content" className="pt-20 pb-16 px-4">
          <div className="max-w-xl mx-auto mt-10">
            <div className="card-premium rounded-ios-card p-8 text-center">
              <h1 className="font-display text-2xl font-semibold text-space-100 mb-2">
                Article not found
              </h1>
              <p className="text-sm text-space-300 mb-6">
                The article you are looking for does not exist or may have moved.
              </p>
              <Link to="/blog">
                <button className="btn-secondary h-10 px-4 text-sm inline-flex items-center gap-1.5">
                  <ChevronLeft className="w-4 h-4" />
                  Back to blog
                </button>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const relatedArticles = getRelatedArticles(slug || '', 3);

  return (
    <div className="min-h-screen bg-space-900 text-space-100">
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
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-space-300 mb-8 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
            <Link to="/blog" className="hover:text-space-100 transition-colors">Blog</Link>
            <span className="text-space-400">›</span>
            <span className="text-space-300">{article.category}</span>
            <span className="text-space-400">›</span>
            <span className="text-space-200 truncate">{article.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
            {/* Main article */}
            <article className="min-w-0 max-w-3xl">
              {/* Title + meta */}
              <header className="mb-8">
                <h1 className="font-display text-4xl md:text-5xl font-semibold text-space-100 tracking-tight leading-[1.1]">
                  {article.title}
                </h1>
                <p className="text-lg text-space-300 mt-4 leading-relaxed">
                  {article.description}
                </p>

                <div className="mt-6 flex items-center gap-3 flex-wrap text-sm text-space-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-electric/15 border border-electric/25 flex items-center justify-center">
                      <span className="text-xs font-medium text-electric">
                        {article.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-space-200">{article.author}</span>
                  </div>
                  <span className="text-space-400">·</span>
                  <span>{formatReadableDate(article.date)}</span>
                  <span className="text-space-400">·</span>
                  <span className="chip-electric text-xs">{article.readTime}</span>
                </div>
              </header>

              {/* Hero image */}
              {article.heroImage && (
                <div className="mb-10 rounded-ios-card overflow-hidden shadow-premium">
                  <img
                    src={article.heroImage}
                    alt={article.heroImageAlt || article.title}
                    className="w-full h-auto max-h-[440px] object-cover"
                  />
                </div>
              )}

              {/* Article body */}
              <div className="prose prose-invert prose-lg max-w-none
                prose-headings:font-display prose-headings:font-semibold prose-headings:text-space-100 prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-base prose-p:text-space-200 prose-p:leading-relaxed
                prose-a:text-electric prose-a:no-underline hover:prose-a:text-electric-bright
                prose-strong:text-space-100
                prose-blockquote:border-l-4 prose-blockquote:border-electric prose-blockquote:bg-space-700/40 prose-blockquote:rounded-ios prose-blockquote:px-5 prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-space-200
                prose-code:font-num prose-code:text-sm prose-code:text-electric prose-code:bg-space-700/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-space-700/80 prose-pre:border prose-pre:border-space-500 prose-pre:rounded-ios prose-pre:font-num prose-pre:text-sm prose-pre:text-space-100
                prose-img:rounded-ios-card prose-img:shadow-premium
                prose-li:text-space-200 prose-ul:text-space-200 prose-ol:text-space-200
                ">
                <ReactMarkdown>{article.content}</ReactMarkdown>
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag} className="chip text-xs text-space-300">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share row */}
              <div className="mt-8 pt-6 border-t border-space-500/60 flex flex-wrap gap-2">
                <button onClick={handleShare} className="btn-secondary h-10 px-4 text-sm inline-flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button onClick={handleCopyLink} className="btn-secondary h-10 px-4 text-sm inline-flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copy link
                </button>
                <button onClick={handleTwitterShare} className="btn-secondary h-10 px-4 text-sm inline-flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Tweet
                </button>
              </div>

              {/* Related posts */}
              {relatedArticles.length > 0 && (
                <section className="mt-16">
                  <h2 className="font-display text-2xl font-semibold text-space-100 mb-6 tracking-tight">
                    Related articles
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {relatedArticles.map((related) => (
                      <Link
                        key={related.slug}
                        to={`/blog/${related.slug}`}
                        className="card-premium rounded-ios-card overflow-hidden hover:shadow-premium-lg group transition-all"
                      >
                        {related.heroImage && (
                          <div className="aspect-[16/9] bg-space-700 overflow-hidden">
                            <img
                              src={related.heroImage}
                              alt={related.heroImageAlt || related.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <span className="chip-electric text-[10px] mb-2 inline-flex">{related.category}</span>
                          <h3 className="font-display text-sm font-semibold text-space-100 line-clamp-2 mb-1.5 group-hover:text-electric-bright transition-colors">
                            {related.title}
                          </h3>
                          <p className="text-xs text-space-300 line-clamp-2 leading-relaxed">
                            {related.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <div className="mt-10">
                <Link to="/blog">
                  <button className="btn-secondary h-10 px-4 text-sm inline-flex items-center gap-1.5">
                    <ChevronLeft className="w-4 h-4" />
                    Back to blog
                  </button>
                </Link>
              </div>
            </article>

            {/* Sidebar — TOC */}
            <aside className="hidden lg:block">
              <div className="panel rounded-ios-card p-5 sticky top-24">
                <div className="text-xs font-medium text-space-400 uppercase tracking-wide mb-3">
                  On this page
                </div>
                {tocItems.length === 0 ? (
                  <div className="text-xs text-space-400">No sections</div>
                ) : (
                  <nav className="space-y-1.5">
                    {tocItems.map((item) => {
                      const active = activeId === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(item.id)?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                          }}
                          className={[
                            'block text-sm transition-colors leading-snug',
                            item.level === 3 ? 'pl-4' : 'pl-0',
                            active ? 'text-electric font-medium' : 'text-space-300 hover:text-space-100',
                          ].join(' ')}
                        >
                          {item.text}
                        </a>
                      );
                    })}
                  </nav>
                )}

                {/* Reading progress */}
                <div className="mt-6 pt-4 border-t border-space-500/60">
                  <div className="h-1 bg-space-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-electric transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-space-400 mt-1.5">
                    {Math.round(progress)}% read
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
