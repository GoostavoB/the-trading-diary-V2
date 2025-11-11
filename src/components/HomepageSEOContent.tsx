import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle } from "lucide-react";

/**
 * SEO-rich content section for homepage
 * Addresses the "low content rate" issue by adding 1000+ words of visible, valuable content
 */
export function HomepageSEOContent() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-900/50 to-gray-950/50">
      <div className="container max-w-6xl mx-auto">

        {/* Main Content Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
            Why Every Crypto Trader Needs a Trading Journal
          </h2>
          <div className="prose prose-invert max-w-none space-y-6 text-gray-300 text-lg">
            <p>
              In the fast-paced world of cryptocurrency trading, keeping track of your trades manually is not just inefficient—it's nearly impossible. With 24/7 markets, multiple exchanges, and hundreds of trading pairs, successful traders need more than just luck. They need data, insights, and a systematic approach to improve their performance.
            </p>
            <p>
              <strong>TheTradingDiary.com</strong> is the #1 crypto trading journal designed specifically for cryptocurrency traders who want to track every trade, analyze patterns, and develop winning strategies. Whether you're a day trader executing dozens of trades daily, a swing trader holding positions for days or weeks, or an investor building a long-term portfolio, our platform provides the tools you need to succeed.
            </p>
          </div>
        </div>

        {/* Problem-Solution Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            The Problems Crypto Traders Face
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="glass-strong border-red-500/20">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4 text-red-400">❌ Without a Trading Journal</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>No clear record of what strategies actually work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Repeating the same mistakes without realizing it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Trading on emotions instead of data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Wasting hours on manual spreadsheet updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Scattered trade history across multiple exchanges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>No insights into trading psychology and emotional patterns</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass-strong border-primary/20">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4 text-primary">✅ With TheTradingDiary.com</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Automatically import trades from 20+ major exchanges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Identify patterns in winning and losing trades instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Track emotions and psychology to avoid emotional trading</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Save hours with automated tracking and analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Unified view of all trades across all exchanges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Make data-driven decisions backed by real performance metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Features Deep Dive */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Powerful Features Built for Crypto Traders
          </h2>
          <div className="space-y-8 text-gray-300">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">🔄 Automatic Trade Import</h3>
              <p className="text-lg leading-relaxed">
                Stop wasting time on manual data entry. Connect your exchange accounts using secure, read-only API keys and watch your trades sync automatically. We support Binance, Coinbase, Kraken, KuCoin, Bybit, and 15+ other major exchanges. Your API keys have no withdrawal permissions—your funds stay completely secure while we fetch your trade history. Whether you're trading spot, futures, perpetual swaps, or options, all your positions are tracked seamlessly.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">📊 Advanced Analytics Dashboard</h3>
              <p className="text-lg leading-relaxed">
                Transform raw trade data into actionable insights. Our analytics dashboard shows you exactly what's working and what's not. Track win rate by cryptocurrency, identify your most profitable trading hours, analyze profit factor, calculate Sharpe ratios, and visualize your equity curve over time. Drill down into specific subsets of trades using powerful filters—see performance by exchange, coin, strategy tag, or time period. Every metric is calculated in real-time as you trade.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">🧠 Trading Psychology Tracking</h3>
              <p className="text-lg leading-relaxed">
                Your biggest enemy in trading isn't the market—it's your emotions. TheTradingDiary.com helps you understand how fear, greed, FOMO, and overconfidence affect your results. Rate your emotional state before and after each trade. Tag trades with feelings like "confident," "fearful," or "revenge trading." Over time, our analytics reveal patterns: Do you trade worse when anxious? Do you hold winners too long when greedy? Awareness is the first step to trading discipline.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">📝 Comprehensive Trade Notes</h3>
              <p className="text-lg leading-relaxed">
                Every trade tells a story. Document your reasoning with rich text notes, attach chart screenshots, tag trades with strategy names, and add entry/exit criteria. Months later, review exactly why you took a trade and what you can learn from it. Our note-taking system supports markdown formatting, image uploads, and custom tags. Search your entire trade history by keywords, find all trades with specific setups, and build a personal trading playbook based on what actually works.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">🎯 Risk Management Tools</h3>
              <p className="text-lg leading-relaxed">
                Professional traders manage risk first, profits second. Use our position size calculator to determine exactly how much to risk per trade based on your account size and risk tolerance. Set stop-loss and take-profit levels before entering positions. Track your maximum drawdown and get alerts when you're approaching risk limits. Calculate risk-reward ratios automatically for every trade. Never blow up your account again with proper risk management built into your workflow.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">📈 Performance Reports</h3>
              <p className="text-lg leading-relaxed">
                Generate beautiful, professional reports for tax purposes, accountability partners, or personal review. Export detailed statements showing all trades with entry/exit prices, fees, P&L, and holding periods. Our reports are accepted by tax professionals and support crypto tax reporting requirements in multiple jurisdictions. Filter by date range, exchange, or coin. Download as PDF or CSV. Perfect for end-of-year tax preparation or quarterly performance reviews.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Get Started in 3 Simple Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-strong border-primary/20">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-4">1</div>
                <h3 className="text-xl font-semibold mb-3">Sign Up Free</h3>
                <p className="text-gray-300">
                  Create your account in 30 seconds. No credit card required for the free trial. Start tracking immediately with manual entry or connect your exchanges in the next step.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-primary/20">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-4">2</div>
                <h3 className="text-xl font-semibold mb-3">Connect Exchanges</h3>
                <p className="text-gray-300">
                  Link your trading accounts using secure, read-only API keys. Your historical trades import automatically. Multi-exchange? No problem—track everything in one place.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-primary/20">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-4">3</div>
                <h3 className="text-xl font-semibold mb-3">Analyze & Improve</h3>
                <p className="text-gray-300">
                  Review your analytics dashboard, identify patterns in your trading, learn from mistakes, and develop strategies based on real data—not gut feelings or emotions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Who It's For */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Who Uses TheTradingDiary.com?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Day Traders",
                description: "Execute dozens of trades daily and need fast, automated tracking to review performance without drowning in manual data entry."
              },
              {
                title: "Swing Traders",
                description: "Hold positions for days or weeks and want to track longer-term patterns, analyze hold times, and optimize entry/exit timing."
              },
              {
                title: "Algorithmic Traders",
                description: "Run trading bots and need comprehensive logs to backtest strategies, track bot performance, and optimize algorithms."
              },
              {
                title: "Portfolio Investors",
                description: "Build long-term crypto portfolios and want to track cost basis, calculate unrealized gains, and plan tax-efficient exits."
              }
            ].map((profile, index) => (
              <Card key={index} className="glass-strong border-primary/10">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-3 text-primary">{profile.title}</h3>
                  <p className="text-gray-300 text-sm">{profile.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="glass-strong border-primary/20 px-6 rounded-lg">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                Is my trading data secure?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Absolutely. We use bank-level encryption (AES-256) to protect all your data. API keys are stored encrypted and have read-only permissions—they cannot withdraw funds or make trades. We never see or store your exchange passwords. Your trading data is private and will never be shared with third parties.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="glass-strong border-primary/20 px-6 rounded-lg">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                Which exchanges do you support?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                We support 20+ major exchanges including Binance, Coinbase, Kraken, KuCoin, Bybit, OKX, Gate.io, Huobi, Bitfinex, Gemini, and many more. Can't find your exchange? You can manually import trades via CSV or request integration support.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="glass-strong border-primary/20 px-6 rounded-lg">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                Do I need to enter trades manually?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                No! Our automatic import feature syncs trades from connected exchanges. However, if you prefer manual entry or trade on unsupported platforms, our manual entry form is fast and intuitive. You can also bulk import historical trades via CSV.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="glass-strong border-primary/20 px-6 rounded-lg">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                How much does it cost?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                We offer a 14-day free trial with full access to all features. No credit card required. After the trial, plans start at just $9.99/month—less than the cost of one bad trade. We also offer annual plans with significant discounts. See our pricing page for details.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="glass-strong border-primary/20 px-6 rounded-lg">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                Can I track multiple exchange accounts?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Yes! Connect unlimited exchange accounts and see all your trades in one unified dashboard. Perfect for traders who diversify across multiple platforms or manage multiple strategies on different exchanges.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="glass-strong border-primary/20 px-6 rounded-lg">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                Does it work for futures and options trading?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Absolutely! TheTradingDiary.com supports spot trading, futures contracts, perpetual swaps, options, and even DeFi transactions. Track leverage, funding rates, liquidations, and all the metrics specific to derivatives trading.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="glass-strong border-primary/20 px-6 rounded-lg">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                How will this improve my trading?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Trading journals help you identify what works and what doesn't. You'll discover your most profitable setups, times of day when you trade best, coins that match your style, and emotional patterns affecting performance. Professional traders journal every trade—now you can too, without the manual work.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="glass-strong border-primary/20 px-6 rounded-lg">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                Can I export my data?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Yes! Export trade history, performance reports, and analytics to CSV or PDF anytime. Your data is always yours. We never lock you in. Perfect for tax reporting, sharing with accountability partners, or backing up your records.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="glass-strong border-primary/20 px-6 rounded-lg">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                Is there a mobile app?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                TheTradingDiary.com is fully responsive and works beautifully on mobile browsers. While we don't have native iOS/Android apps yet, our web platform provides a seamless experience on phones and tablets. Mobile apps are on our roadmap!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="glass-strong border-primary/20 px-6 rounded-lg">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                What if I need help getting started?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                We provide comprehensive documentation, video tutorials, and responsive customer support. Our team typically responds within 24 hours. Plus, our interface is intuitive—most users are up and running within 5 minutes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Trade Smarter?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join thousands of successful crypto traders using TheTradingDiary.com to track performance, identify patterns, and achieve consistent profitability. Start your free 14-day trial today—no credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
