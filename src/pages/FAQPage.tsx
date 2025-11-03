import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import MetaTags from "@/components/SEO/MetaTags";

const faqs = [
  {
    question: "What exchanges does The Trading Diary support?",
    answer: "The Trading Diary supports Binance, Bybit, Coinbase, Kraken, OKX, and many other major cryptocurrency exchanges through API integration and CSV/screenshot upload."
  },
  {
    question: "Is The Trading Diary free to use?",
    answer: "Yes, The Trading Diary offers a free tier with basic features including 5 total uploads, basic analytics, XP system, and community leaderboard. Premium plans start at $8/month (yearly) with advanced analytics and unlimited trade tracking."
  },
  {
    question: "How does automated trade tracking work?",
    answer: "Simply upload screenshots of your trades or connect your exchange API (read-only permissions). Our AI automatically extracts trade data, calculates P&L, and generates performance analytics."
  },
  {
    question: "Can I import trades from multiple exchanges?",
    answer: "Absolutely! The Trading Diary is designed for multi-exchange tracking. Upload trades from Binance, Bybit, Coinbase, Kraken, and others all in one place."
  },
  {
    question: "What is the XP and gamification system?",
    answer: "Earn XP points for every trade you log, completing daily goals, and maintaining trading streaks. Level up to unlock new widgets, badges, and features. The gamification system makes journaling addictive and helps build consistent trading discipline."
  },
  {
    question: "How secure is my trading data?",
    answer: "We use bank-level encryption for all data transmission and storage. Your API keys (if used) are encrypted and stored securely. We never have withdrawal permissions, only read-only access to trade history."
  },
  {
    question: "Can I export my trading data?",
    answer: "Yes! You can export your trades and performance data to CSV format at any time. Your data is always yours to download and analyze externally."
  },
  {
    question: "What trading performance metrics do you track?",
    answer: "We track 15+ key metrics including win rate, profit factor, Sharpe ratio, max drawdown, expectancy, risk-reward ratio, average win/loss, time in trade, and more. All metrics update in real-time."
  },
  {
    question: "Does The Trading Diary work on mobile?",
    answer: "Yes! The Trading Diary is a Progressive Web App (PWA) that works seamlessly on desktop, mobile, and tablet. You can install it as an app on your device for the best experience."
  },
  {
    question: "How is The Trading Diary different from spreadsheets?",
    answer: "Unlike spreadsheets, The Trading Diary offers: automated data extraction from screenshots, AI-powered insights, gamification with XP and badges, real-time performance analytics, psychology tracking, and multi-exchange integration—all without manual data entry."
  },
  {
    question: "Can I track paper trades?",
    answer: "Yes! You can manually log paper trades to practice journaling and test strategies risk-free. This helps you build the discipline habit before trading with real capital."
  },
  {
    question: "What languages does The Trading Diary support?",
    answer: "The Trading Diary currently supports English, Spanish, Portuguese, Arabic, and Vietnamese, with more languages coming soon."
  },
  {
    question: "Do you offer a refund policy?",
    answer: "Yes, we offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact us within 14 days for a full refund."
  },
  {
    question: "How do I upgrade or downgrade my plan?",
    answer: "You can change your plan anytime from your account settings. Upgrades take effect immediately, while downgrades apply at the end of your current billing cycle."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. You'll retain access until the end of your current billing period, and no future charges will be made."
  }
];

export default function FAQPage() {
  return (
    <>
      <MetaTags
        title="FAQ - Frequently Asked Questions | The Trading Diary"
        description="Find answers to common questions about The Trading Diary: features, pricing, security, multi-exchange support, and more."
        keywords="trading journal FAQ, crypto journal questions, trading diary help, multi-exchange trading, trading analytics"
      />
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <FAQ
          title="Frequently Asked Questions"
          description="Everything you need to know about The Trading Diary"
          faqs={faqs}
        />
        <Footer />
      </div>
    </>
  );
}
