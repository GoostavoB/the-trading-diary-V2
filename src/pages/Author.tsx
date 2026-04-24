import { useParams, Link } from 'react-router-dom';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    name: 'Gustavo',
    bio: 'Active crypto trader and founder of The Trading Diary. Built this platform after years of frustration with spreadsheets and scattered notes — to give traders a real system to track, analyze, and improve every trade. Focused on perpetual futures, risk management, and data-driven discipline.',
    expertise: ['Crypto Futures Trading', 'Risk Management', 'Trading Psychology', 'Data-Driven Performance', 'Trading Journal Systems'],
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
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <SEO
          title="Author Not Found | The Trading Diary"
          description="The author you are looking for does not exist."
          canonical="https://www.thetradingdiary.com/blog"
        />
        <SkipToContent />
        <MobileHeader />
        <main id="main-content" className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Author Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The author you're looking for doesn't exist.
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
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
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>

          {/* Author Profile Card */}
          <PremiumCard className="p-8 bg-card border-border">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{author.name}</h1>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {author.bio}
                </p>

                {/* Contact & Links */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {author.email && (
                    <a
                      href={`mailto:${author.email}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
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
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
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
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Expertise Tags */}
            <div className="border-t border-border pt-6">
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Areas of Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {author.expertise.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </PremiumCard>

          {/* Articles by Author */}
          <PremiumCard className="p-8 bg-card border-border">
            <h2 className="text-2xl font-bold mb-6">
              Articles by {author.name} ({authorArticles.length})
            </h2>

            {authorArticles.length === 0 ? (
              <p className="text-muted-foreground">No articles published yet.</p>
            ) : (
              <div className="grid gap-6">
                {authorArticles.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/blog/${article.slug}`}
                    className="p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary">
                        {article.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {article.readTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2">
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
