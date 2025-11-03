import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Shield, Zap, Globe, CheckCircle2, X } from "lucide-react";
import MetaTags from "@/components/SEO/MetaTags";
import SchemaMarkup, { createFAQSchema } from "@/components/SEO/SchemaMarkup";

export default function BestCryptoTradingJournal() {
  const faqs = [
    {
      question: "Does image upload work with my exchange?",
      answer: "Yes! The Trading Diary works with EVERY exchange through screenshot upload. It doesn't matter if it's Binance, a small regional exchange, or even a DeFi wallet. If you can see it, our AI can read it."
    },
    {
      question: "Is image upload as good as API integration?",
      answer: "Actually better in many ways: More secure (no exchange access), works with ALL exchanges (not just 10-15), faster setup (zero configuration), and never breaks when exchanges update."
    },
    {
      question: "How accurate is the AI data extraction?",
      answer: "95%+ accuracy on major exchanges, 80-90% on others. You always review before confirming, so 100% of logged trades are accurate."
    },
    {
      question: "Can I upload multiple trades at once?",
      answer: "Yes! Batch upload feature lets you upload 10-20 screenshots, and AI processes them all automatically."
    }
  ];

  return (
    <>
      <MetaTags
        title="Best Crypto Trading Journal 2025: Image Upload Technology"
        description="The Trading Diary works with EVERY exchange via AI-powered image upload. No API needed, maximum security. Track all trades in 15 seconds. Try free!"
        keywords="best trading journal, trading journal app, crypto trading journal, image upload trading journal, universal exchange support"
      />
      <SchemaMarkup type="faq" data={createFAQSchema(faqs)} />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Best Crypto Trading Journal 2025: Complete Comparison & Guide
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              The brutal truth about trading: 90% of traders fail within their first year. But here's what the winning 10% have in common—they all keep detailed trading journals.
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Free Trial - No Credit Card Required
              </Button>
            </Link>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">
              What Makes The Trading Diary Different?
            </h2>
            
            <Card className="p-8 mb-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Camera className="h-6 w-6 text-primary" />
                Universal Exchange Support via Image Upload
              </h3>
              <p className="text-lg mb-6">
                Here's the game-changer: The Trading Diary works with <strong>EVERY exchange on the planet</strong>.
              </p>
              
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4">
                  <Camera className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold">1. Screenshot</p>
                  <p className="text-sm text-muted-foreground">Take a photo of your trade</p>
                </div>
                <div className="text-center p-4">
                  <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold">2. Upload</p>
                  <p className="text-sm text-muted-foreground">Upload to the app</p>
                </div>
                <div className="text-center p-4">
                  <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold">3. AI Extracts</p>
                  <p className="text-sm text-muted-foreground">Data extracted automatically</p>
                </div>
                <div className="text-center p-4">
                  <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold">4. Done!</p>
                  <p className="text-sm text-muted-foreground">Trade logged in 15 seconds</p>
                </div>
              </div>

              <div className="bg-primary/5 p-6 rounded-lg">
                <h4 className="font-bold mb-3">Works with:</h4>
                <ul className="grid md:grid-cols-2 gap-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Binance (any region)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Bybit</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Coinbase & Coinbase Pro</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Kraken</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> KuCoin</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> OKX</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> ANY exchange (even small/regional)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> DeFi protocols (MetaMask, TrustWallet)</li>
                </ul>
              </div>
            </Card>

            {/* Comparison Table */}
            <h3 className="text-2xl font-bold mb-6 text-center">
              Why Image Upload Beats API Connections
            </h3>
            <Card className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left">Feature</th>
                    <th className="p-4 text-center bg-primary/10">Image Upload<br/>(The Trading Diary)</th>
                    <th className="p-4 text-center">API Integration<br/>(Competitors)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4 font-semibold">Security</td>
                    <td className="p-4 text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> Zero exchange access</td>
                    <td className="p-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /> Requires API keys</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-semibold">Exchange Support</td>
                    <td className="p-4 text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> ALL exchanges</td>
                    <td className="p-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /> Limited to 10-15</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-semibold">Setup Time</td>
                    <td className="p-4 text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> Instant (just upload)</td>
                    <td className="p-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /> 5-20 min per exchange</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-semibold">Privacy</td>
                    <td className="p-4 text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> Complete control</td>
                    <td className="p-4 text-center"><X className="h-5 w-5 text-orange-500 mx-auto" /> App has read access</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-semibold">Works Offline</td>
                    <td className="p-4 text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> Yes (sync later)</td>
                    <td className="p-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /> Needs internet</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">DeFi Support</td>
                    <td className="p-4 text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> Yes (screenshot wallet)</td>
                    <td className="p-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /> No</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Key Features You Need
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <Globe className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">AI-Powered Image Recognition</h3>
                <p className="text-muted-foreground">
                  95%+ accuracy on major exchanges. Reads your trade screenshots and extracts all data automatically. Works with 50+ different exchange formats.
                </p>
              </Card>

              <Card className="p-6">
                <Zap className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Gamification & XP System</h3>
                <p className="text-muted-foreground">
                  Earn XP for uploading trades, following your rules, and maintaining streaks. Unlock achievements and make trade logging fun instead of boring.
                </p>
              </Card>

              <Card className="p-6">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Maximum Security</h3>
                <p className="text-muted-foreground">
                  Zero exchange access needed. No API keys to manage. No risk of accidental permissions. Complete data privacy and control.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Pricing & Plans</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <p className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal">/month</span></p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>5 uploads total</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>1 account only</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>Basic analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>$5 for 10 more uploads</span>
                  </li>
                </ul>
                <Link to="/auth">
                  <Button variant="outline" className="w-full">Start Free</Button>
                </Link>
              </Card>

              <Card className="p-6 border-primary border-2 relative">
                <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-sm rounded-bl">
                  Popular
                </div>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-3xl font-bold mb-4">$12<span className="text-sm font-normal">/month</span></p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>30 uploads per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>Unlimited accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>$2 per 10 extra uploads</span>
                  </li>
                </ul>
                <a href="/#pricing-section">
                  <Button className="w-full">Get Pro</Button>
                </a>
              </Card>

              <Card className="p-6">
                <h3 className="text-2xl font-bold mb-2">Elite</h3>
                <p className="text-3xl font-bold mb-4">$25<span className="text-sm font-normal">/month</span></p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>Unlimited uploads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>No extra costs</span>
                  </li>
                </ul>
                <a href="/#pricing-section">
                  <Button variant="outline" className="w-full">Get Elite</Button>
                </a>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="p-6">
                  <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Track Every Trade in 15 Seconds?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join 10,000+ traders using The Trading Diary to improve their win rates and save hours every week.
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-12 py-6">
                Start Free Trial - No Credit Card
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
