import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { usePageMeta } from '@/hooks/usePageMeta';
import { blogArticles } from '@/data/blogArticles';
import { ExternalLink } from 'lucide-react';

const Sitemap = () => {
  usePageMeta({
    title: 'Sitemap | The Trading Diary',
    description: 'Complete sitemap of The Trading Diary - Find all pages, blog articles, and resources in one place.',
    canonical: 'https://www.thetradingdiary.com/sitemap',
    keywords: 'sitemap, site navigation, all pages'
  });
  
  const englishArticles = blogArticles.filter(article => article.language === 'en');
  const categories = Array.from(new Set(englishArticles.map(a => a.category)));
  
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Sitemap
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Navigate through all pages and resources on The Trading Diary
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Main Pages */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              Main Pages
            </h2>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-primary hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-primary hover:underline">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-primary hover:underline">
                  Sign In / Sign Up
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/sitemap" className="text-primary hover:underline">
                  Sitemap
                </Link>
              </li>
            </ul>
          </Card>
          
          {/* App Features */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">App Features</h2>
            <ul className="space-y-3">
              <li>
                <Link to="/dashboard" className="text-primary hover:underline">
                  Dashboard
                </Link>
                <p className="text-sm text-muted-foreground ml-4">Track your trading performance</p>
              </li>
              <li>
                <Link to="/upload" className="text-primary hover:underline">
                  Upload Trades
                </Link>
                <p className="text-sm text-muted-foreground ml-4">Import from exchanges</p>
              </li>
              <li>
                <Link to="/analytics" className="text-primary hover:underline">
                  Analytics
                </Link>
                <p className="text-sm text-muted-foreground ml-4">Advanced insights</p>
              </li>
              <li>
                <Link to="/tools" className="text-primary hover:underline">
                  Trading Tools
                </Link>
                <p className="text-sm text-muted-foreground ml-4">Risk calculators & forecasts</p>
              </li>
            </ul>
          </Card>
          
          {/* Blog Categories */}
          {categories.map(category => {
            const categoryArticles = englishArticles.filter(a => a.category === category);
            
            return (
              <Card key={category} className="p-6">
                <h2 className="text-2xl font-bold mb-4">{category}</h2>
                <ul className="space-y-2">
                  {categoryArticles.map(article => (
                    <li key={article.slug}>
                      <Link 
                        to={`/blog/${article.slug}`} 
                        className="text-primary hover:underline text-sm"
                      >
                        {article.title}
                      </Link>
                      <p className="text-xs text-muted-foreground ml-4">
                        {article.readTime} • {new Date(article.date).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
          
          {/* Resources */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Resources</h2>
            <ul className="space-y-3">
              <li>
                <a 
                  href="/sitemap.xml" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  XML Sitemap
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-sm text-muted-foreground ml-4">For search engines</p>
              </li>
              <li>
                <a 
                  href="/blog/rss.xml" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  RSS Feed
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-sm text-muted-foreground ml-4">Subscribe to blog updates</p>
              </li>
            </ul>
          </Card>
          
          {/* Languages */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Languages</h2>
            <ul className="space-y-3">
              <li>
                <Link to="/en/blog" className="text-primary hover:underline">
                  English Blog
                </Link>
              </li>
              <li>
                <Link to="/pt/blog" className="text-primary hover:underline">
                  Blog Português
                </Link>
              </li>
              <li>
                <Link to="/es/blog" className="text-primary hover:underline">
                  Blog Español
                </Link>
              </li>
              <li>
                <Link to="/ar/blog" className="text-primary hover:underline">
                  مدونة عربية
                </Link>
              </li>
              <li>
                <Link to="/vi/blog" className="text-primary hover:underline">
                  Blog Tiếng Việt
                </Link>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Sitemap;
