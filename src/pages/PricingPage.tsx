import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { usePromoStatus } from "@/hooks/usePromoStatus";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { trackLandingEvents } from "@/utils/analyticsEvents";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PricingComparison from "@/components/pricing/PricingComparison";
import PricingFAQ from "@/components/pricing/PricingFAQ";
import PricingAddOns from "@/components/pricing/PricingAddOns";
import FirstWeekBlock from "@/components/pricing/FirstWeekBlock";
import { StickyOfferBar } from "@/components/pricing/StickyOfferBar";
import { AnimatedStats } from "@/components/pricing/AnimatedStats";
import { PricingStorySection } from "@/components/pricing/PricingStorySection";
import { XPProgressAnimation } from "@/components/pricing/XPProgressAnimation";
import { ProblemVisual } from "@/components/pricing/ProblemVisual";
import { SpeedComparisonVisual } from "@/components/pricing/SpeedComparisonVisual";
import { SecurityVisual } from "@/components/pricing/SecurityVisual";
import { SocialProofSection } from "@/components/pricing/SocialProofSection";

const PricingPage = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const promoStatus = usePromoStatus();

  useEffect(() => {
    trackLandingEvents.trackViewPricing();
  }, []);

  const handleBillingToggle = (cycle: 'monthly' | 'yearly') => {
    setBillingCycle(cycle);
    trackLandingEvents.trackEvent('track_toggle_billing', { cycle });
  };

  const handleStartTrial = (plan: string) => {
    trackLandingEvents.trackStartTrial(plan);
    navigate('/auth');
  };

  const includedFeatures = [
    "AI uploads from image screenshots",
    "Weekly heatmap and best assets",
    "Fees dashboard with maker vs taker and funding",
    "Leverage and position size calculator",
    "Risk alerts and pre-trade checklist",
    "Encrypted data and CSV export"
  ];

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Start your trading discipline journey',
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyTotal: 0,
      features: [
        '5 uploads total',
        'Basic analytics and XP system',
        'Limited widgets',
        'Community leaderboard',
        'CSV upload support',
        'Basic win rate tracking'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Active traders optimizing discipline and costs',
      monthlyPrice: promoStatus.isActive ? 12 : 15,
      yearlyPrice: promoStatus.isActive ? 8 : 10,
      yearlyTotal: promoStatus.isActive ? 96 : 120,
      regularMonthlyPrice: 15,
      regularYearlyPrice: 10,
      features: [
        '50 uploads per month',
        'Full XP system + gamified progression',
        'Advanced analytics suite',
        'Custom widgets and color themes',
        'Upload up to 10 trades at once',
        'Fee analysis and optimization',
        'Weekly drawdown alerts',
        'Email support'
      ],
      cta: 'Go Pro Now',
      popular: true
    },
    {
      id: 'elite',
      name: 'Elite',
      description: 'Professional traders with unlimited needs',
      monthlyPrice: 25,
      yearlyPrice: 20,
      yearlyTotal: 240,
      features: [
        'Unlimited uploads',
        'Elite XP tiers and rewards',
        'Priority analytics reports',
        'Full customization and API exports',
        'MFE/MAE analysis',
        'Automated weekly email reports',
        'Priority support',
        'Early access to new features'
      ],
      cta: 'Join Elite',
      popular: false
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black overflow-x-hidden">
      {/* Sticky Offer Bar */}
      <StickyOfferBar />
      
      <PublicHeader />
      
      <main className="pt-20 pb-20 overflow-x-hidden">
        {/* Hero Section */}
        <section className="px-6 mb-8">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 
                  className="font-bold leading-tight tracking-tight"
                  style={{ 
                    fontSize: 'clamp(32px, 4.5vw, 52px)',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Train your discipline. Master your trading performance.
                </h1>
                <p className="text-[17px] text-muted-foreground/70 font-light leading-relaxed max-w-2xl mx-auto">
                  Develop the mindset of top traders through our XP discipline system, proven to increase trading performance by 23% within 4 weeks.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => handleStartTrial('pro')}
                  className="px-8 py-6 text-[15px] font-semibold"
                >
                  Start Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const element = document.getElementById('pricing-cards');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-6 text-[15px] font-semibold"
                >
                  See Plans
                </Button>
              </div>

              {/* Risk reversal strip */}
              <p className="text-[15px] text-foreground/90 font-semibold">
                Free entry plan • No credit card • Cancel anytime
              </p>
            </motion.div>
          </div>
        </section>

        {/* Animated Stats */}
        <section className="px-6 mb-20">
          <div className="container mx-auto max-w-4xl">
            <AnimatedStats />
          </div>
        </section>

        {/* Included in all plans */}
        <section className="px-6 mb-20">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
              <h3 className="text-[18px] font-semibold mb-4 text-center">Included in all plans</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {includedFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-[14px]">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-foreground/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Storytelling Section 1 - The Problem */}
        <PricingStorySection
          headline="Most traders fail because they lack consistency."
          copy={
            <>
              <p>
                90% of traders lose money because they don't journal, track performance, or follow 
                a daily structure. Emotions take over. Discipline disappears. Losses pile up.
              </p>
              <p>
                Our system fixes that. Automatically. By making discipline rewarding through gamification, 
                we help you build the habits that separate winning traders from the rest.
              </p>
            </>
          }
          visual={<ProblemVisual />}
        />

        {/* Storytelling Section 2 - The XP System */}
        <PricingStorySection
          headline="Discipline, gamified."
          copy={
            <>
              <p>
                Our XP system rewards consistency and discipline. Every time you follow your plan, 
                journal your trades, and stick to your rules, you earn XP and level up your profile.
              </p>
              <p>
                The system trains your mind through repetition and small wins. It's not just tracking—it's 
                behavioral transformation backed by real performance data.
              </p>
            </>
          }
          dataFact="Traders who journal and review trades consistently show an average 23% performance improvement in 4 weeks (based on data from over 1,000 active users)."
          visual={<XPProgressAnimation />}
          reverse
        />

        {/* Storytelling Section 3 - Speed and Efficiency */}
        <PricingStorySection
          headline="Upload 10 trades in one click."
          copy={
            <>
              <p>
                Most traders skip journaling because it's slow. Our AI-based uploader lets you upload 
                up to 10 trades at once from a single image. That's 40 times faster than manual entry.
              </p>
              <p>
                Scalpers who make 30+ trades a day can now journal everything in minutes instead of hours. 
                No more excuses. No more missed insights.
              </p>
            </>
          }
          visual={<SpeedComparisonVisual />}
        />

        {/* Storytelling Section 4 - Security and Privacy */}
        <PricingStorySection
          headline="Safe by design. Your data, your trades."
          copy={
            <>
              <p>
                We never connect to APIs or exchanges. Your trading data is encrypted and saved securely 
                on our cloud infrastructure. Only you can access it.
              </p>
              <p>
                No risk of external tracking or data leaks. No third-party integrations that compromise 
                your privacy. 100% trader-owned data.
              </p>
            </>
          }
          visual={<SecurityVisual />}
          reverse
        />

        {/* Pricing Cards Section */}
        <section id="pricing-cards" className="px-6 mb-12 scroll-mt-20">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 
                className="font-bold leading-tight tracking-tight mb-4"
                style={{ 
                  fontSize: 'clamp(28px, 4vw, 42px)',
                  letterSpacing: '-0.01em'
                }}
              >
                Choose your plan. Train like a pro.
              </h2>
              <p className="text-[17px] text-muted-foreground/80 max-w-2xl mx-auto">
                No credit card required. Upgrade anytime. Plans built to keep you disciplined.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 mb-8">
              {/* Badge above buttons */}
              <div className="inline-block bg-green-500 text-white text-[13px] px-3 py-1.5 rounded-full font-semibold">
                Save 2 months with yearly
              </div>
              
              {/* Toggle buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleBillingToggle('monthly')}
                  className={`px-6 py-3 rounded-xl text-[15px] font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => handleBillingToggle('yearly')}
                  className={`px-6 py-3 rounded-xl text-[15px] font-medium transition-all ${
                    billingCycle === 'yearly'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`relative glass backdrop-blur-md rounded-2xl p-8 ${
                    plan.popular ? 'ring-2 ring-primary shadow-xl' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                      Recommended
                    </div>
                  )}
                  
                  {promoStatus.isActive && plan.id === 'pro' && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-3 right-4 animate-pulse flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      {promoStatus.daysRemaining > 0 
                        ? `Offer ends in ${promoStatus.daysRemaining}d`
                        : `Ends in ${promoStatus.hoursRemaining}h`
                      }
                    </Badge>
                  )}

                  <div className="mb-6">
                    <h3 className="text-[22px] font-bold mb-2 tracking-tight">{plan.name}</h3>
                    <p className="text-[14px] text-muted-foreground/70 mb-4 leading-relaxed">{plan.description}</p>
                    
                    {plan.monthlyPrice > 0 ? (
                      <>
                        <div className="flex items-baseline gap-2 mb-2">
                          {promoStatus.isActive && plan.id === 'pro' && (
                            <span className="text-2xl font-bold text-muted-foreground line-through mr-1">
                              ${billingCycle === 'yearly' ? plan.regularYearlyPrice : plan.regularMonthlyPrice}
                            </span>
                          )}
                          <span className="text-[38px] font-bold tracking-tight tabular-nums">${getPrice(plan)}</span>
                          <span className="text-[14px] text-muted-foreground/70">
                            /month
                          </span>
                        </div>
                        {promoStatus.isActive && plan.id === 'pro' && (
                          <div className="text-[13px] font-semibold text-green-600 dark:text-green-400 mb-2">
                            🎉 Save 40% during launch offer
                          </div>
                        )}
                        {billingCycle === 'yearly' && plan.yearlyTotal && (
                          <div className="text-[13px] text-muted-foreground/70 mb-2">
                            Billed ${plan.yearlyTotal} once
                          </div>
                        )}
                        {billingCycle === 'yearly' && (
                          <div className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-[12px] rounded-md font-medium">
                            Save {((1 - plan.yearlyPrice / plan.monthlyPrice) * 12).toFixed(0)} months
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-[38px] font-bold tracking-tight mb-2">Free</div>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      trackLandingEvents.trackEvent('track_select_plan_click', { plan: plan.name });
                      handleStartTrial(plan.id);
                    }}
                    className={`w-full mb-4 py-6 text-[15px] font-semibold ${
                      plan.popular ? 'bg-primary hover:bg-primary/90' : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>

                  <p className="text-[13px] text-muted-foreground/70 text-center mb-6">
                    No hidden fees
                  </p>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => {
                      // Determine if this feature needs a tooltip
                      let tooltipContent = null;
                      
                      if (feature.includes('uploads')) {
                        tooltipContent = "One upload can include up to 10 trades. Upload 10 trades at once to maximize efficiency.";
                      } else if (feature.includes('XP system')) {
                        tooltipContent = "Earn XP points for consistency, build discipline streaks, and unlock higher trading tiers.";
                      } else if (feature.includes('analytics')) {
                        tooltipContent = "Track win rate, drawdown, expectancy, and consistency metrics in real time.";
                      } else if (feature.includes('widgets')) {
                        tooltipContent = "Build your own dashboard with custom widgets for psychology, risk, or PnL metrics.";
                      } else if (feature.includes('Fee analysis')) {
                        tooltipContent = "Analyze maker vs taker fees, funding rates, and optimize your trading costs.";
                      } else if (feature.includes('MFE/MAE')) {
                        tooltipContent = "Maximum Favorable Excursion and Maximum Adverse Excursion analysis to refine your entries and exits.";
                      }
                      
                      return (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-[14px] text-muted-foreground/70 flex items-center gap-1 leading-relaxed">
                            {feature}
                            {tooltipContent && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-[13px]">{tooltipContent}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              ))}
            </div>

          </div>
        </section>

        {/* Limits and Definitions */}
        <section className="px-6 mb-12">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-secondary/20 rounded-xl p-6">
              <div className="flex flex-wrap gap-6 justify-center text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 cursor-help">
                      <HelpCircle className="w-4 h-4" />
                      <span>What counts as a trade?</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Each closed order counts as 1 trade</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 cursor-help">
                      <HelpCircle className="w-4 h-4" />
                      <span>What counts as an upload?</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Counted per file or image processed by AI</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <p className="text-muted-foreground">
                  Taxes calculated at checkout
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <PricingComparison />

        {/* First Week Block */}
        <FirstWeekBlock />

        {/* Add-ons */}
        <PricingAddOns />

        {/* FAQ */}
        <PricingFAQ />

        {/* Social Proof & Testimonials */}
        <SocialProofSection />

        {/* Trust and Security */}
        <section className="px-6 mb-12">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
              <div className="flex flex-wrap justify-center gap-6 mb-4">
                <span className="text-sm">Encrypted data</span>
                <span className="text-sm">Local imports</span>
                <span className="text-sm">Access control by account</span>
              </div>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
                <span>•</span>
                <Link to="/terms" className="hover:underline">Terms</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 mb-20">
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 
                className="font-bold leading-tight tracking-tight mb-4"
                style={{ 
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  letterSpacing: '-0.01em'
                }}
              >
                Start your free plan. Begin training your discipline today.
              </h2>
              <p className="text-[17px] text-muted-foreground/80 mb-6 max-w-xl mx-auto">
                Upload your trades and start earning XP. Build the habits of top traders.
              </p>
              <Button
                size="lg"
                onClick={() => handleStartTrial('pro')}
                className="px-10 py-7 text-[15px] font-semibold"
              >
                Start Free
              </Button>
              <p className="text-[13px] text-muted-foreground mt-4">
                No credit card required • Free entry plan
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
