import { Card } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { Link } from 'react-router-dom';

const articles = [
  {
    title: 'Why Every Trader Needs a Trading Journal',
    description: 'Discover how keeping a detailed trading journal can transform your trading performance and help you identify patterns in your behavior.',
    readTime: '5 min read',
    slug: 'why-traders-need-journal'
  },
  {
    title: 'Top 5 Crypto Trading Strategies That Work',
    description: 'Learn the most effective cryptocurrency trading strategies used by successful traders, from scalping to swing trading.',
    readTime: '8 min read',
    slug: 'top-crypto-strategies'
  },
  {
    title: 'Crypto vs Stocks: Which Is Better for Traders?',
    description: 'A comprehensive comparison of cryptocurrency and stock trading, exploring volatility, liquidity, and profit potential.',
    readTime: '6 min read',
    slug: 'crypto-vs-stocks'
  },
  {
    title: 'How to Build a Profitable Trading Plan',
    description: 'Step-by-step guide to creating a robust trading plan that includes risk management, entry/exit strategies, and performance tracking.',
    readTime: '10 min read',
    slug: 'build-trading-plan'
  },
  {
    title: '5 Risk Management Rules Every Trader Should Follow',
    description: 'Essential risk management principles that protect your capital and maximize long-term trading success.',
    readTime: '7 min read',
    slug: 'risk-management-rules'
  }
];

const Blog = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Trading Blog</h1>
          <p className="text-muted-foreground">Expert insights, strategies, and tips for traders</p>
        </div>

        <div className="grid gap-6">
          {articles.map((article) => (
            <Link to={`/blog/${article.slug}`} key={article.slug}>
              <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300 cursor-pointer group">
                <h2 className="text-2xl font-semibold mb-2 group-hover:text-neon-green transition-colors">
                  {article.title}
                </h2>
                <p className="text-muted-foreground mb-3">{article.description}</p>
                <p className="text-sm text-muted-foreground">{article.readTime}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Blog;
