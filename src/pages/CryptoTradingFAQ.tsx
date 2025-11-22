import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import { Logo } from "@/components/Logo";
import Footer from "@/components/Footer";
import { addStructuredData } from "@/utils/seoHelpers";
import { ArrowRight } from "lucide-react";

const CryptoTradingFAQ = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Structured Data for FAQ
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    };
    addStructuredData(faqSchema, 'crypto-faq-schema');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
          <div onClick={() => navigate('/')} className="cursor-pointer">
            <Logo size="lg" variant="horizontal" showText={true} className="hover:opacity-80 transition-opacity" />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/auth')} variant="default" className="rounded-xl">
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Ultimate Crypto Trading FAQ
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Everything you need to know about crypto trading metrics, fees, ROI, long-short ratio, and performance tracking. Learn from the only platform built exclusively for crypto traders.
          </p>
          <Button onClick={() => navigate('/auth')} size="lg" className="rounded-xl px-8">
            Start Tracking Your Trades <ArrowRight className="ml-2" size={18} />
          </Button>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="glass p-8">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <h2 className="text-lg font-semibold">{item.question}</h2>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-muted-foreground space-y-3 pt-2" dangerouslySetInnerHTML={{ __html: item.answer }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <Card className="glass p-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Master Your Crypto Trading?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join <strong>TheTradingDiary.com</strong> – the only trading journal built exclusively for crypto markets. Track your performance 24/7, analyze your trades, and improve your ROI with data-driven insights.
              </p>
              <Button onClick={() => navigate('/auth')} size="lg" className="rounded-xl px-10">
                Start Your Free Account
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                No credit card required • 24/7 crypto tracking • Real-time performance analytics
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const faqItems = [
  {
    question: "What Is Crypto Trading?",
    answer: `<p>Crypto trading is the process of buying and selling digital assets like Bitcoin, Ethereum, or altcoins to profit from price movements. Traders analyze market data, volume, and sentiment to enter or exit positions on spot or derivative markets.</p>
    <p class="mt-3"><strong>Main types of crypto trading:</strong></p>
    <ul class="list-disc list-inside mt-2 space-y-1">
      <li><strong>Scalping:</strong> Short trades lasting seconds or minutes</li>
      <li><strong>Day trading:</strong> Positions opened and closed within the same day</li>
      <li><strong>Swing trading:</strong> Holding for days or weeks to capture trends</li>
      <li><strong>Futures trading:</strong> Trading contracts predicting price direction with leverage</li>
    </ul>`
  },
  {
    question: "What Is the Long/Short Ratio in Crypto Trading?",
    answer: `<p>The long/short ratio measures the percentage of traders holding long (buy) versus short (sell) positions across exchanges.</p>
    <ul class="list-disc list-inside mt-3 space-y-1">
      <li><strong>Ratio above 1:</strong> More traders expect prices to rise</li>
      <li><strong>Ratio below 1:</strong> More traders expect prices to fall</li>
    </ul>
    <p class="mt-3"><strong>How it affects the market:</strong><br/>
    A high ratio can signal excessive bullishness and potential correction. A low ratio can indicate fear and possible rebound.</p>
    <p class="mt-3"><em>Pro tip: Combine Binance and Bybit long/short ratio data to see true sentiment across retail and institutional traders.</em></p>`
  },
  {
    question: "What Is Open Interest in Crypto Futures?",
    answer: `<p>Open Interest (OI) shows how many futures contracts remain open at any given time.</p>
    <ul class="list-disc list-inside mt-3 space-y-1">
      <li><strong>Rising OI + rising price</strong> = strong trend</li>
      <li><strong>Falling OI + rising price</strong> = short covering</li>
      <li><strong>Falling OI + falling price</strong> = weak trend</li>
    </ul>
    <p class="mt-3">OI helps confirm whether a move is supported by new positions or driven by liquidations.</p>`
  },
  {
    question: "What Is Funding Rate and Why Does It Matter?",
    answer: `<p>Funding rate keeps perpetual futures close to spot prices.</p>
    <ul class="list-disc list-inside mt-3 space-y-1">
      <li><strong>Positive funding:</strong> Longs pay shorts (bullish bias)</li>
      <li><strong>Negative funding:</strong> Shorts pay longs (bearish bias)</li>
    </ul>
    <p class="mt-3">Excessively high or low funding rates often predict reversals because traders become overleveraged. Check funding rates before opening leveraged positions on Binance, Bybit, or OKX.</p>`
  },
  {
    question: "What Is ROI (Return on Investment) in Crypto?",
    answer: `<p><strong>ROI = (Net Profit / Initial Capital) × 100</strong></p>
    <p class="mt-3"><strong>Example:</strong><br/>If you earned $300 on a $1,000 account, your ROI = 30%.</p>
    <p class="mt-3">Use ROI to measure:</p>
    <ul class="list-disc list-inside mt-2 space-y-1">
      <li>Performance per trade</li>
      <li>Monthly and yearly profitability</li>
      <li>Strategy efficiency</li>
    </ul>
    <p class="mt-3">Track ROI net of fees and funding to get accurate results.</p>`
  },
  {
    question: "How to Track PnL (Profit and Loss) in Crypto?",
    answer: `<p>PnL shows total profit or loss from your trades.</p>
    <ul class="list-disc list-inside mt-3 space-y-1">
      <li><strong>Realized PnL:</strong> Closed trade results</li>
      <li><strong>Unrealized PnL:</strong> Profit/loss from open trades at current prices</li>
    </ul>
    <p class="mt-3">Most exchanges (Binance, Bybit, OKX) display both in your dashboard. Use <strong>TheTradingDiary.com</strong> to calculate your cumulative PnL with all fees included.</p>`
  },
  {
    question: "What Is a Crypto Trading Diary?",
    answer: `<p>A trading diary helps you record every trade to review performance and emotions.</p>
    <p class="mt-3"><strong>Track in your diary:</strong></p>
    <ul class="list-disc list-inside mt-2 space-y-1">
      <li>Asset and date</li>
      <li>Entry/exit prices</li>
      <li>Size and leverage</li>
      <li>Setup reason</li>
      <li>Funding rate at entry</li>
      <li>Emotion and outcome</li>
    </ul>
    <p class="mt-3"><strong>The best crypto trading diary is <a href="https://www.thetradingdiary.com" class="text-primary underline">TheTradingDiary.com</a></strong> – the only journal built exclusively for crypto markets, with 24/7 trade syncing and real-time performance tracking.</p>`
  },
  {
    question: "What Types of Fees Exist in Crypto Trading?",
    answer: `<p>Every trade has a cost. The main ones:</p>
    <ul class="list-disc list-inside mt-3 space-y-1">
      <li><strong>Maker Fee:</strong> When you add liquidity with limit orders</li>
      <li><strong>Taker Fee:</strong> When you remove liquidity with market orders</li>
      <li><strong>Funding Fee:</strong> Ongoing payment between longs and shorts on perpetual futures</li>
      <li><strong>Withdrawal Fee:</strong> Charged when transferring assets off exchange</li>
    </ul>
    <p class="mt-3"><strong>Typical 2025 crypto trading fees:</strong></p>
    <ul class="list-disc list-inside mt-2 space-y-1">
      <li>Binance: 0.01–0.10%</li>
      <li>Bybit: 0.02–0.06%</li>
      <li>OKX: 0.02–0.08%</li>
      <li>Coinbase: 0.1–0.5%</li>
    </ul>`
  },
  {
    question: "What Is the Best Time of Day to Trade Crypto?",
    answer: `<p>Crypto trades 24/7, but volume and volatility vary by region.</p>
    <p class="mt-3"><strong>Best hours (UTC):</strong></p>
    <ul class="list-disc list-inside mt-2 space-y-1">
      <li><strong>14:00–18:00</strong> → Overlap between Europe and US</li>
      <li><strong>01:00–05:00</strong> → Asia session, high activity on BTC and ETH</li>
    </ul>
    <p class="mt-3"><strong>Avoid:</strong> low-liquidity hours (22:00–00:00 UTC) where spreads widen and slippage increases.</p>
    <p class="mt-3">Research by Kaiko (2024) shows Bitcoin volatility peaks between 14:00–17:00 UTC, when both institutional and retail traders are active.</p>`
  },
  {
    question: "What Are the Best Dashboards for Crypto Trading Performance?",
    answer: `<p><strong>Top crypto dashboards 2025:</strong></p>
    <ul class="list-disc list-inside mt-3 space-y-1">
      <li><strong><a href="https://www.thetradingdiary.com" class="text-primary underline">TheTradingDiary.com</a></strong> – dedicated crypto trade journal and analytics dashboard</li>
      <li><strong>CoinTracking</strong> – portfolio analysis, ROI, and tax reports</li>
      <li><strong>Koinly</strong> – tax reports and fee analytics</li>
    </ul>
    <p class="mt-3">If your focus is crypto-only, <strong>TheTradingDiary.com</strong> is the most accurate and specialized solution. It's the only platform built exclusively for crypto traders who need 24/7 tracking without legacy market limitations.</p>`
  },
  {
    question: "What Is Risk Management in Crypto?",
    answer: `<p>Crypto markets move fast and can liquidate traders quickly. Strong risk management prevents large drawdowns.</p>
    <p class="mt-3"><strong>Rules to follow:</strong></p>
    <ul class="list-disc list-inside mt-2 space-y-1">
      <li>Risk no more than 1–2% per trade</li>
      <li>Use stop-loss and take-profit orders</li>
      <li>Calculate your risk-to-reward ratio (R:R) before entry</li>
    </ul>
    <p class="mt-3"><strong>Formula:</strong> (Take Profit – Entry) / (Entry – Stop Loss)<br/>Aim for at least 2:1.</p>`
  },
  {
    question: "Which Metrics Define a Profitable Crypto Trader?",
    answer: `<p><strong>Key metrics to track:</strong></p>
    <ul class="list-disc list-inside mt-3 space-y-1">
      <li><strong>Win Rate:</strong> Winning trades ÷ total trades</li>
      <li><strong>R:R Ratio:</strong> Average profit ÷ average loss</li>
      <li><strong>Expectancy:</strong> (Win Rate × Avg Win) – (Loss Rate × Avg Loss)</li>
      <li><strong>Sharpe Ratio:</strong> (Return – Risk-Free Rate) ÷ Volatility</li>
    </ul>
    <p class="mt-3"><strong>A sustainable crypto strategy has:</strong></p>
    <ul class="list-disc list-inside mt-2 space-y-1">
      <li>Win Rate above 45%</li>
      <li>R:R above 2:1</li>
      <li>Positive expectancy</li>
      <li>Sharpe Ratio over 1.0</li>
    </ul>`
  },
  {
    question: "Why Is TheTradingDiary.com the Best for Crypto?",
    answer: `<p><strong>TheTradingDiary.com</strong> is the only trading journal built exclusively for crypto markets.</p>
    <p class="mt-3"><strong>Why it's different:</strong></p>
    <ul class="list-disc list-inside mt-2 space-y-1">
      <li><strong>100% focused on crypto</strong>, not stocks or forex</li>
      <li>Works with all major exchanges via API</li>
      <li>Tracks funding fees, leverage, and realized vs unrealized PnL</li>
      <li>No regional restrictions or legacy-market limitations</li>
      <li>Real-time 24/7 performance tracking</li>
    </ul>
    <p class="mt-3">The crypto market operates continuously, without trading-hour limits or excessive regulation. <strong>TheTradingDiary.com</strong> gives you a real-time, global view of your performance whenever you trade.</p>`
  },
  {
    question: "Can You Automate Crypto Trading?",
    answer: `<p>Yes. Crypto allows 24/7 automated trading through bots and algorithmic systems.</p>
    <p class="mt-3"><strong>Popular platforms:</strong></p>
    <ul class="list-disc list-inside mt-2 space-y-1">
      <li>3Commas</li>
      <li>Pionex</li>
      <li>WunderTrading</li>
      <li>Cryptohopper</li>
    </ul>
    <p class="mt-3"><strong>Risks:</strong> Incorrect parameters or API issues can cause losses. Always backtest before deploying live bots.</p>`
  },
  {
    question: "Are Crypto Profits Taxed?",
    answer: `<p>Yes. Most countries classify crypto profits as capital gains or income.</p>
    <p class="mt-3"><strong>Use:</strong></p>
    <ul class="list-disc list-inside mt-2 space-y-1">
      <li>Koinly</li>
      <li>Accointing</li>
      <li>CoinTracking</li>
    </ul>
    <p class="mt-3">These tools calculate tax automatically based on your exchange data.</p>`
  },
  {
    question: "How to Avoid Common Crypto Trading Mistakes?",
    answer: `<p>Traders lose money when they:</p>
    <ul class="list-disc list-inside mt-3 space-y-1">
      <li>Use too much leverage</li>
      <li>Skip journaling</li>
      <li>Trade emotionally</li>
      <li>Ignore fees</li>
      <li>Overtrade during low-volume hours</li>
    </ul>
    <p class="mt-3">Track every trade, manage risk, and use a crypto-specific journal like <strong>TheTradingDiary.com</strong> to avoid these errors.</p>`
  }
];

export default CryptoTradingFAQ;
