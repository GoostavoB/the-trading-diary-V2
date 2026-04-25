import { useParams, Link } from 'react-router-dom';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { MobileHeader } from '@/components/MobileHeader';
import Footer from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { blogArticles } from '@/data/blogArticles';
import { ArrowLeft, User, Mail, Globe, Twitter } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { addStructuredData } from '@/utils/seoHelpers';
import { useEffect } from 'react';

const authorData: Record<string, {
  name: string;
  bio: string;
  expertise: string[];
  email?: string;
  website?: string;
  twitter?: string;
  avatar?: string;
}> = {
  'gustavo': {
    name: 'Gustavo Belfiore',
    bio: 'Active crypto trader and founder of The Trading Diary. Gustavo has been trading crypto perpetual futures since the 2021 cycle, with a focus on ETH, BTC, and high-liquidity altcoin perps on Binance and Bybit. He built The Trading Diary after years of frustration with spreadsheets, Notion templates, and scattered chart screenshots — he needed a real system to track, analyze, and improve every trade, and nothing on the market was crypto-native enough. Today he writes about the three things that actually move the needle for discretionary crypto traders: risk management, psychology, and data-driven discipline. His writing is opinionated toward small, surviving edges compounded over thousands of trades rather than the hero-trade fantasies popular on Twitter. Outside of trading, Gustavo works on the product, talks directly to users, and ships updates based on their feedback.',
    expertise: ['Crypto Perpetual Futures', 'Risk Management', 'Trading Psychology', 'Data-Driven Performance', 'Trading Journal Systems', 'Crypto Derivatives Analytics'],
    email: 'gustavo@thetradingdiary.com',
    website: 'https://www.thetradingdiary.com',
    twitter: 'https://twitter.com/thetradingdiary'
  }
};

const Author = () => {
  const { authorSlug } = useParams();
  const author = authorSlug ? authorData[authorSlug] : null;

  // Get articles by this author
  const authorArticles = author
    ? blogArticles.filter(article =>
      article.author.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === authorSlug
    )
    : [];

  // SEO Meta Tags and Structured Data
  useEffect(() => {
    if (author && authorSlug) {
      // Person Schema
      const personSchema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": author.name,
        "description": author.bio,
        "url": `https://www.thetradingdiary.com/author/${authorSlug}`,
        "email": author.email,
        "jobTitle": author.expertise[0],
        "knowsAbout": author.expertise,
        "sameAs": [
          author.twitter,
          author.website
        ].filter(Boolean)
      };

      addStructuredData(personSchema, 'author-schema');
    }
  }, [author, authorSlug]);

  if (!author || !authorSlug) {
    return (
      <div className="min-h-screen bg-space-800">
        <SEO
          title="Author Not Found | The Trading Diary"
          description="The author you are looking for does not exist."
          canonical="https://www.thetradingdiary.com/blog"
        />
        <SkipToContent />
        <MobileHeader />
        <main id="main-content" className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center py-12 space-y-4">
            <p className="text-xs text-space-400">Blog / Author</p>
            <h1 className="font-display text-3xl text-gradient-electric-soft">Author Not Found</h1>
            <p className="text-sm text-space-300 mb-6">
              The author you're looking for doesn't exist.
            </p>
            <Link to="/blog">
              <Button variant="outline" className="btn-secondary gap-2">
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

  return (
    <div className="min-h-screen bg-space-800">
      <SEO
        title={`${author.name} - Trading Expert | The Trading Diary`}
        description={`${author.bio.substring(0, 155)}...`}
        canonical={`https://www.thetradingdiary.com/author/${authorSlug}`}
      />
      <SkipToContent />
      <MobileHeader />
      <main id="main-content" className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link to="/blog">
            <Button variant="ghost" className="gap-2 mb-4 text-space-300">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>

          {/* Author Profile Card */}
          <PremiumCard className="card-premium-highlight p-8">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="font-display text-3xl text-gradient-electric-soft mb-2">{author.name}</h1>
                <p className="text-space-300 mb-4 leading-relaxed">
                  {author.bio}
                </p>

                {/* Contact & Links */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {author.email && (
                    <a
                      href={`mailto:${author.email}`}
                      className="flex items-center gap-2 text-space-300 hover:text-primary transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {author.email}
                    </a>
                  )}
                  {author.website && (
                    <a
                      href={author.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-space-300 hover:text-primary transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {author.twitter && (
                    <a
                      href={author.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-space-300 hover:text-primary transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Expertise Tags */}
            <div className="border-t border-space-500/40 pt-6">
              <h2 className="text-xs font-semibold mb-3 text-space-400 uppercase tracking-wide">Areas of Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {author.expertise.map((skill, index) => (
                  <span key={index} className="chip chip-electric">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </PremiumCard>

          {/* Articles by Author */}
          <PremiumCard className="card-premium p-8">
            <h2 className="font-display text-2xl text-gradient-electric-soft mb-6">
              Articles by {author.name} ({authorArticles.length})
            </h2>

            {authorArticles.length === 0 ? (
              <p className="text-space-300">No articles published yet.</p>
            ) : (
              <div className="grid gap-6">
                {authorArticles.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/blog/${article.slug}`}
                    className="p-6 rounded-ios-card bg-muted/30 hover:bg-muted/50 transition-all hover:shadow-lg border border-space-500/40"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="chip chip-electric">
                        {article.category}
                      </span>
                      <span className="text-xs text-space-400">
                        {new Date(article.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-space-400">•</span>
                      <span className="text-xs text-space-400">
                        {article.readTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-space-100 hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-space-300 line-clamp-2">
                      {article.description}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Author;
