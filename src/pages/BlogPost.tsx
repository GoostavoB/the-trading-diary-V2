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
        toast.success('Link copied to clipboard!');
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('[COPIED] link in clipboard');
  };

  const handlePrint = () => window.print();

  const progressBar = (() => {
    const total = 20;
    const filled = Math.round((progress / 100) * total);
    return '█'.repeat(filled) + '░'.repeat(total - filled);
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void text-phosphor">
        <SkipToContent />
        <MobileHeader />
        <main id="main-content" className="pt-20 pb-16 px-4">
          <div className="max-w-5xl mx-auto space-y-4 font-mono">
            <div className="term-header">loading ./posts/{slug}.md ...</div>
            <div className="term-card p-6 space-y-3">
              <div className="h-4 w-1/3 bg-phosphor-dim animate-pulse" />
              <div className="h-8 w-3/4 bg-phosphor-dim animate-pulse" />
              <div className="space-y-2 mt-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-3 bg-phosphor-dim opacity-40 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-void text-phosphor">
        <SEO
          title="Article Not Found"
          description="The article you are looking for does not exist."
          canonical="https://www.thetradingdiary.com/blog"
        />
        <SkipToContent />
        <MobileHeader />

        <main id="main-content" className="pt-20 pb-16 px-4">
          <div className="max-w-3xl mx-auto mt-10 font-mono">
            <div className="hud-panel-danger p-8 relative">
              <div className="hud-corners">
                <span className="hud-c tl" />
                <span className="hud-c tr" />
                <span className="hud-c bl" />
                <span className="hud-c br" />
              </div>
              <div className="text-danger text-xs mb-2">ERR_404 // FILE_NOT_FOUND</div>
              <h1 className="font-display text-3xl uppercase text-danger glow-text-danger mb-3">
                Article Not Found
              </h1>
              <p className="text-phosphor-dim mb-6">
                <span className="text-danger">$</span> cat ./posts/{slug}.md
                <br />
                <span className="text-danger">&gt;</span> no such file or directory
              </p>
              <Link to="/blog">
                <button className="btn-term">&lt; BACK_TO_BLOG</button>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const relatedArticles = getRelatedArticles(slug || '', 3);
  const catSlug = article.category.toLowerCase().replace(/\s+/g, '-');
  const modTime = (() => {
    try {
      const d = new Date(article.date);
      return d.toISOString().replace('T', ' ').slice(0, 16);
    } catch {
      return article.date;
    }
  })();

  return (
    <div className="min-h-screen bg-void text-phosphor">
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
          {/* Breadcrumb terminal path */}
          <div className="term-header mb-6 flex items-center justify-between flex-wrap gap-2">
            <span className="text-amber-term font-mono text-xs sm:text-sm">
              ~/blog/{catSlug}/{article.slug}$
            </span>
            <span className="flex items-center gap-2 text-xs">
              <span className="pulse-dot" />
              <span className="status-pill">[READING]</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar — file tree ToC */}
            <aside className="hidden lg:block">
              <div className="term-card p-0 overflow-hidden sticky top-24">
                <div className="term-header text-xs">
                  <span className="text-amber-term">./posts/{article.slug}.md</span>
                </div>
                <div className="p-4 font-mono text-xs">
                  <div className="text-phosphor-dim mb-3">
                    mod: <span className="text-cyan-term">{modTime}</span>
                  </div>
                  <div className="text-phosphor-dim border-t border-dashed border-phosphor-dim/40 pt-3 mb-2">
                    <span className="text-phosphor">── TABLE OF CONTENTS ──</span>
                  </div>
                  {tocItems.length === 0 && (
                    <div className="text-phosphor-dim italic">// no headings</div>
                  )}
                  <nav className="space-y-1 mt-2">
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
                            'block transition-colors',
                            item.level === 3 ? 'pl-6' : 'pl-2',
                            active
                              ? 'text-phosphor glow-text'
                              : 'text-phosphor-dim hover:text-phosphor',
                          ].join(' ')}
                        >
                          <span className={active ? 'text-amber-term' : 'opacity-60'}>
                            {active ? '▸' : '→'}
                          </span>{' '}
                          {item.text}
                        </a>
                      );
                    })}
                  </nav>

                  {/* Reading progress */}
                  <div className="mt-6 pt-3 border-t border-dashed border-phosphor-dim/40">
                    <div className="text-phosphor-dim mb-1">READ_PROGRESS</div>
                    <div className="text-cyan-term">
                      [{progressBar}] {Math.round(progress)}%
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main article */}
            <article className="min-w-0">
              {/* Title block */}
              <header className="mb-8">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="status-pill amber">CAT: {article.category}</span>
                  <span className="status-pill cyan">RT: {article.readTime}</span>
                  <span className="status-pill">
                    <span className="pulse-dot" /> by {article.author}
                  </span>
                </div>

                <h1
                  className="font-display uppercase text-3xl sm:text-5xl tracking-wider text-phosphor chromatic leading-tight"
                  data-text={article.title}
                >
                  {article.title}
                </h1>

                <p className="text-phosphor-dim font-mono text-sm mt-4">
                  <span className="text-amber-term">// </span>
                  {article.description}
                </p>
              </header>

              {/* Hero image as CRT capture */}
              {article.heroImage && (
                <div className="relative mb-8 hud-corners">
                  <span className="hud-c tl" />
                  <span className="hud-c tr" />
                  <span className="hud-c bl" />
                  <span className="hud-c br" />
                  <div className="relative overflow-hidden border border-phosphor-dim shadow-phosphor">
                    <img
                      src={article.heroImage}
                      alt={article.heroImageAlt || article.title}
                      className="w-full h-64 sm:h-80 object-cover"
                    />
                    <div className="scanlines absolute inset-0 pointer-events-none" />
                    <div className="scan-bar absolute inset-0 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Article body */}
              <div className="term-card p-5 sm:p-8 relative">
                <div className="prose prose-invert max-w-none font-mono blog-terminal-content">
                  <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-6 font-mono text-xs flex flex-wrap gap-2">
                  <span className="text-phosphor-dim">tags:</span>
                  {article.tags.map((tag) => (
                    <span key={tag} className="text-cyan-term">
                      #{tag.replace(/\s+/g, '_').toLowerCase()}
                    </span>
                  ))}
                </div>
              )}

              {/* Terminal actions */}
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={handleShare} className="btn-term">SHARE</button>
                <button onClick={handleCopyLink} className="btn-term-amber">COPY_LINK</button>
                <button onClick={handlePrint} className="btn-term">PRINT</button>
              </div>

              {/* Related */}
              {relatedArticles.length > 0 && (
                <section className="mt-16">
                  <div className="term-header mb-4 flex items-center justify-between">
                    <span>./related --limit=3</span>
                    <span className="text-phosphor-dim text-xs">
                      {relatedArticles.length} match{relatedArticles.length === 1 ? '' : 'es'}
                    </span>
                  </div>

                  <div className="term-card p-2 sm:p-4 font-mono text-sm">
                    {relatedArticles.map((related, idx) => {
                      const relDate = (() => {
                        try {
                          const d = new Date(related.date);
                          return d.toISOString().slice(0, 10);
                        } catch {
                          return related.date;
                        }
                      })();
                      return (
                        <div key={related.slug}>
                          <Link
                            to={`/blog/${related.slug}`}
                            className="block py-3 px-2 hover:bg-phosphor-dim transition-colors group"
                          >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-phosphor-dim">
                              <span className="text-amber-term">[{relDate}]</span>
                              <span className="text-cyan-term">
                                CAT_{related.category.toUpperCase().replace(/\s+/g, '-')}
                              </span>
                            </div>
                            <div className="mt-1 flex items-start gap-2">
                              <span className="text-amber-term">&gt;</span>
                              <span className="text-phosphor group-hover:text-amber-term group-hover:glow-text-amber">
                                {related.title}
                              </span>
                            </div>
                            <div className="mt-1 flex items-start gap-2 text-phosphor-dim">
                              <span>//</span>
                              <span className="line-clamp-2">{related.description}</span>
                            </div>
                          </Link>
                          {idx < relatedArticles.length - 1 && (
                            <div className="border-t border-dashed border-phosphor-dim/40" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Back link */}
              <div className="mt-10">
                <Link to="/blog">
                  <button className="btn-term">&lt; CD_..</button>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
