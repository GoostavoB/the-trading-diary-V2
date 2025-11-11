import { useEffect } from "react";
import Hero from "@/components/Hero";
import DashboardShowcase from "@/components/DashboardShowcase";
import Features from "@/components/Features";
import ExchangeLogos from "@/components/ExchangeLogos";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { MobileHeader } from "@/components/MobileHeader";
import { ProofBar } from "@/components/ProofBar";
import { SkipToContent } from "@/components/SkipToContent";
import { HomepageSEOContent } from "@/components/HomepageSEOContent";
import { addStructuredData } from "@/utils/seoHelpers";

const Index = () => {
  useEffect(() => {
    // Set page title and meta description
    document.title = "The #1 Crypto Trading Journal | Track & Analyze Every Trade";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'The best crypto trading journal for serious traders. Automatically track trades from 20+ exchanges, analyze performance, and improve your trading strategy with data-driven insights.');
    }

    // Add FAQ schema for rich snippets
    addStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is a crypto trading journal?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A crypto trading journal is a tool that helps you track, analyze, and review every cryptocurrency trade you make. It automatically imports trades from exchanges like Binance, Bybit, and OKX, then provides insights into your performance, win rate, profit/loss, and trading patterns to help you improve your strategy."
          }
        },
        {
          "@type": "Question",
          "name": "Why do I need a trading journal for crypto?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A trading journal helps you identify patterns in your trading behavior, track what strategies work best, measure your actual performance objectively, avoid emotional trading decisions, and continuously improve through data-driven insights. Studies show traders who journal their trades perform 23% better than those who don't."
          }
        },
        {
          "@type": "Question",
          "name": "How does The Trading Diary import trades automatically?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Trading Diary connects to your exchange via API (read-only for security) and automatically imports all your trades, including spot, futures, and margin trades. Supported exchanges include Binance, Bybit, OKX, KuCoin, Gate.io, Kraken, Coinbase, and 15+ others."
          }
        },
        {
          "@type": "Question",
          "name": "Is The Trading Diary free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! The Trading Diary offers a free plan with 100 trades per month, basic analytics, and manual CSV import. Paid plans (Pro at $9.99/mo and Premium at $19.99/mo) include unlimited trades, AI-powered insights, multi-exchange support, and advanced analytics."
          }
        },
        {
          "@type": "Question",
          "name": "What exchanges does The Trading Diary support?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Trading Diary supports 20+ major cryptocurrency exchanges including Binance, Bybit, OKX, KuCoin, Gate.io, Kraken, Coinbase Pro, Bitfinex, BitMEX, Phemex, Huobi, and more. You can connect multiple exchanges to track all your trades in one place."
          }
        },
        {
          "@type": "Question",
          "name": "Is my trading data secure?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, security is our top priority. We use read-only API keys (no withdrawal permissions), encrypt all data with AES-256 encryption, store data on secure AWS servers, never share your data with third parties, and comply with GDPR and data protection regulations."
          }
        },
        {
          "@type": "Question",
          "name": "Can I track both spot and futures trades?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! The Trading Diary automatically tracks both spot and futures trades (including perpetual and quarterly contracts). It also supports margin trading, options, and leveraged tokens across all supported exchanges."
          }
        },
        {
          "@type": "Question",
          "name": "How is The Trading Diary different from Excel?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Unlike Excel, The Trading Diary offers: automatic trade import (no manual entry), AI-powered trade analysis, real-time performance tracking, beautiful visualizations and dashboards, mobile app access, multi-exchange support, and automatic fee calculations. It saves hours of manual work every week."
          }
        }
      ]
    }, 'homepage-faq-schema');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <SkipToContent />
      <MobileHeader />
      
      <main id="main-content" className="pt-14">
        <Hero />
        <ProofBar />
        <DashboardShowcase />
        <Features />
        <HomepageSEOContent />
        <ExchangeLogos />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
