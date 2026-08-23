import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MobileHeader } from '@/components/MobileHeader';
import Footer from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { Clock, Calendar, User, ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { getLanguageFromPath } from '@/utils/languageRouting';
import DOMPurify from 'dompurify';

// Mock blog data - in real app, fetch from API/CMS
const blogArticles: Record<string, any> = {
  'how-to-start-crypto-trading': {
    title: 'How to Start Crypto Trading: A Beginner\'s Guide',
    slug: 'how-to-start-crypto-trading',
    excerpt: 'Learn the fundamentals of cryptocurrency trading, from setting up your first exchange account to making your first trade.',
    content: `
      <h2>Getting Started with Crypto Trading</h2>
      <p>Cryptocurrency trading can seem intimidating at first, but with the right knowledge and tools, anyone can start trading successfully.</p>
      
      <h3>1. Choose a Reliable Exchange</h3>
      <p>The first step is selecting a reputable cryptocurrency exchange. Popular options include Binance, Coinbase, and Kraken.</p>
      
      <h3>2. Understand the Basics</h3>
      <p>Before you start trading, make sure you understand key concepts like market orders, limit orders, and stop-loss orders.</p>
      
      <h3>3. Start Small</h3>
      <p>Begin with small amounts that you can afford to lose. This allows you to learn without risking significant capital.</p>
      
      <h3>4. Keep a Trading Journal</h3>
      <p>Document every trade you make. This helps you identify patterns and improve your strategy over time.</p>
    `,
    author: 'Sarah Johnson',
    date: '2025-01-15',
    readingTime: '8 min read',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&q=80',
    tags: ['beginner', 'crypto', 'trading basics'],
  },
  // Add more articles as needed
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const currentLang = getLanguageFromPath(window.location.pathname);

  const article = slug ? blogArticles[slug] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <SkipToContent />
        <MobileHeader />

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <Helmet>
        <title>{article.title} - The Trading Diary Blog</title>
        <meta name="description" content={article.excerpt} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.image} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <SkipToContent />
        <MobileHeader />

        <main id="main-content" className="pt-20 pb-16 px-4">
          <article className="container max-w-4xl mx-auto px-4 py-12">
            <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>

            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(article.date).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {article.readingTime}
                </span>
                <span className="inline-flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {article.author}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">{article.title}</h1>

              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  {article.tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              <img
                src={article.image}
                alt={article.title}
                className="w-full h-[400px] object-cover rounded-lg"
              />
            </header>

            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
            />

            <footer className="mt-12 pt-8 border-t border-border">
              <h3 className="text-xl font-semibold mb-4">About the Author</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{article.author}</p>
                  <p className="text-sm text-muted-foreground">Crypto trading expert and educator</p>
                </div>
              </div>
            </footer>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
}
