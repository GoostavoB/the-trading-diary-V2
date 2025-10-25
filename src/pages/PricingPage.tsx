import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MobileHeader } from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import { trackLandingEvents } from "@/utils/analyticsEvents";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PricingComparison from "@/components/pricing/PricingComparison";
import PricingFAQ from "@/components/pricing/PricingFAQ";
import PricingAddOns from "@/components/pricing/PricingAddOns";
import FirstWeekBlock from "@/components/pricing/FirstWeekBlock";

const PricingPage = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

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
    "AI uploads from CSV and screenshots",
    "Weekly heatmap and best assets",
    "Fees dashboard with maker vs taker and funding",
    "Leverage and position size calculator",
    "Risk alerts and pre-trade checklist",
    "Encrypted data and local imports"
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Beginner traders tracking performance',
      monthlyPrice: 10,
      yearlyPrice: 8,
      yearlyTotal: 96,
      features: [
        '20 uploads per month. Up to 10 trades per upload',
        '1 connected account',
        'AI Insights on the homepage',
        'Trading history, manual trades, spot wallet',
        'Trading journal, drawdown, leverage stop calculator',
        'Market data and smart equity forecast',
        'Email support',
        'Fee analysis not included'
      ],
      cta: 'Start free',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Active traders optimizing risk and costs',
      monthlyPrice: 15,
      yearlyPrice: 12,
      yearlyTotal: 144,
      features: [
        '50 uploads per month. Up to 10 trades per upload',
        'Unlimited accounts',
        'Fee analysis',
        'Trading plan, goals, trading psychology',
        'Reports and tax reports',
        'Custom AI metrics: 3 per month'
      ],
      cta: 'Start 7-day trial',
      popular: true
    },
    {
      id: 'elite',
      name: 'Elite',
      description: 'Professional traders needing advanced analysis and reports',
      monthlyPrice: 25,
      yearlyPrice: 20,
      yearlyTotal: 240,
      features: [
        '120 uploads per month. Up to 10 trades per upload',
        'Unlimited accounts',
        'Everything in Pro',
        'Custom AI metrics: 10 per month',
        'Early access to new features',
        'Premium priority support',
        '50% off extra credits'
      ],
      cta: 'Start 7-day trial',
      popular: false
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <MobileHeader />
      
      <main className="pt-20 pb-20">
        {/* Hero Section */}
        <section className="px-6 mb-16">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Choose your plan and start today
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Upload your trades; AI fills the journal; get 3 actions after your first upload
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button
                  size="lg"
                  onClick={() => handleStartTrial('pro')}
                  className="px-8 py-6 text-base font-semibold"
                >
                  Start 7-day trial
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => trackLandingEvents.trackEvent('track_view_sample_report_click')}
                  className="px-8 py-6 text-base font-semibold border-2"
                >
                  See sample report
                </Button>
              </div>

              {/* Risk reversal strip */}
              <p className="text-sm text-muted-foreground">
                7-day trial • Cancel anytime • Prorated annual refund in the first 14 days
              </p>
            </motion.div>
          </div>
        </section>

        {/* Included in all plans */}
        <section className="px-6 mb-12">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Included in all plans</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {includedFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Billing Toggle */}
        <section className="px-6 mb-12">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => handleBillingToggle('monthly')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => handleBillingToggle('yearly')}
                className={`px-6 py-3 rounded-xl font-medium transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  Save 2 months
                </span>
              </button>
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

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    
                    {plan.monthlyPrice > 0 ? (
                      <>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl font-bold">${getPrice(plan)}</span>
                          <span className="text-sm text-muted-foreground">
                            /month
                          </span>
                        </div>
                        {billingCycle === 'yearly' && plan.yearlyTotal && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Billed ${plan.yearlyTotal} once
                          </div>
                        )}
                        {billingCycle === 'yearly' && (
                          <div className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md">
                            Save {((1 - plan.yearlyPrice / plan.monthlyPrice) * 12).toFixed(0)} months
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-4xl font-bold mb-2">Free</div>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      trackLandingEvents.trackEvent('track_select_plan_click', { plan: plan.name });
                      handleStartTrial(plan.id);
                    }}
                    className={`w-full mb-4 ${
                      plan.popular ? 'bg-primary hover:bg-primary/90' : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mb-6">
                    No hidden fees
                  </p>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => {
                      // Determine if this feature needs a tooltip
                      let tooltipContent = null;
                      
                      if (feature.includes('uploads per month')) {
                        tooltipContent = "One upload spends 1 credit and can include up to 10 trades. To save credits, upload every 10 trades.";
                      } else if (feature.includes('connected account') || feature.includes('Unlimited accounts')) {
                        tooltipContent = "Connect your exchange or broker. Starter supports 1 account. Pro and Elite are unlimited.";
                      } else if (feature.includes('Custom AI metrics')) {
                        tooltipContent = "Create your own metric and add it to your dashboard. Choose the rule, the inputs, and the alert. You can create 3 per month on Pro and 10 per month on Elite.";
                      } else if (feature.includes('Fee analysis')) {
                        tooltipContent = "Detailed fees and funding by trade and by day. Available on Pro and Elite.";
                      } else if (feature.includes('extra credits')) {
                        tooltipContent = "Add 10 uploads for $2. Elite pays $1.";
                      }
                      
                      return (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm flex items-center gap-1">
                            {feature}
                            {tooltipContent && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-sm">{tooltipContent}</p>
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

            {/* Micro-proof badges */}
            <div className="mt-12 text-center">
              <div className="flex flex-wrap justify-center gap-4 mb-3">
                <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm font-medium">
                  Up to 40x faster logging
                </div>
                <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm font-medium">
                  Win rate up to +8 points
                </div>
                <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm font-medium">
                  Max weekly DD −30%
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Results observed in pilot groups; vary by risk, market, and discipline
              </p>
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

        {/* First Week Block */}
        <FirstWeekBlock />

        {/* Comparison Table */}
        <PricingComparison />

        {/* Add-ons */}
        <PricingAddOns />

        {/* FAQ */}
        <PricingFAQ />

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
                <a href="/privacy" className="hover:underline">Privacy Policy</a>
                <span>•</span>
                <a href="/terms" className="hover:underline">Terms</a>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6">
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Start today</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Upload your last 30 days and get 3 actions to raise your average R
              </p>
              <Button
                size="lg"
                onClick={() => handleStartTrial('pro')}
                className="px-10 py-7 text-base font-medium"
              >
                Start 7-day trial
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
