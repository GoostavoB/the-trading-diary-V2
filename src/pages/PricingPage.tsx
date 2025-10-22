import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, TrendingUp, Shield, Zap, Target, Brain, BarChart3, Award, Users, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PricingComparison from "@/components/PricingComparison";
import PricingRoadmap from "@/components/PricingRoadmap";

const PricingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrollY * 0.5}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const problems = [
    {
      icon: TrendingUp,
      title: "Scattered Data",
      description: "Trading data spread across multiple platforms, making analysis impossible",
      color: "text-red-500"
    },
    {
      icon: Brain,
      title: "Emotional Trading",
      description: "No system to track emotional patterns leading to repeated mistakes",
      color: "text-orange-500"
    },
    {
      icon: BarChart3,
      title: "No Real Insights",
      description: "Basic P&L tracking without understanding what actually drives performance",
      color: "text-yellow-500"
    },
    {
      icon: Clock,
      title: "Hours of Manual Work",
      description: "Spending hours manually entering trades and calculating metrics",
      color: "text-blue-500"
    }
  ];

  const solutions = [
    {
      icon: Zap,
      title: "AI-Powered Automation",
      description: "Extract trades from screenshots in seconds with 95%+ accuracy",
      stat: "10x faster",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Target,
      title: "Pattern Recognition",
      description: "Identify winning setups and losing patterns automatically",
      stat: "15+ metrics",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Real-time risk monitoring with position sizing calculators",
      stat: "100% secure",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Award,
      title: "Performance Analytics",
      description: "Professional-grade analytics used by institutional traders",
      stat: "99.9% uptime",
      color: "from-orange-500 to-red-500"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Active Traders", icon: Users },
    { value: "$2M+", label: "Trades Analyzed", icon: DollarSign },
    { value: "95%", label: "User Satisfaction", icon: Award },
    { value: "24/7", label: "Support Available", icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section with Parallax */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div 
          ref={heroRef}
          className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent opacity-50"
        />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="container relative mx-auto max-w-6xl px-6">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">7-Day Free Trial • No Credit Card Required to Start</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground animate-gradient">
              Transform Your Trading
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12">
              Join thousands of traders using AI-powered analytics to make better decisions and improve performance
            </p>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="glass rounded-2xl p-6 hover-lift"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The Problems We Solve
            </h2>
            <p className="text-xl text-muted-foreground">
              Stop letting these issues hold back your trading performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {problems.map((problem, index) => {
              const Icon = problem.icon;
              return (
                <div
                  key={index}
                  className="glass rounded-2xl p-8 hover-lift transition-all group"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br from-background to-muted mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 ${problem.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{problem.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our <span className="text-gradient-primary">Game-Changing</span> Solutions
            </h2>
            <p className="text-xl text-muted-foreground">
              Built by traders, for traders. Every feature designed to improve your edge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <div
                  key={index}
                  className="relative group"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${solution.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`} />
                  <div className="glass rounded-2xl p-8 hover-lift relative">
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${solution.color} mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-bold">{solution.title}</h3>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full bg-gradient-to-r ${solution.color} text-white`}>
                        {solution.stat}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{solution.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Trusted by Traders Worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              Your data security and privacy are our top priorities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-8 text-center hover-lift">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Bank-Level Security</h3>
              <p className="text-muted-foreground">256-bit encryption for all your data</p>
            </div>
            <div className="glass rounded-2xl p-8 text-center hover-lift">
              <Award className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">SOC 2 Compliant</h3>
              <p className="text-muted-foreground">Industry-standard security protocols</p>
            </div>
            <div className="glass rounded-2xl p-8 text-center hover-lift">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">99.9% Uptime</h3>
              <p className="text-muted-foreground">Always available when you need it</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <Pricing />
        </div>
      </section>

      {/* Comparison Table */}
      <PricingComparison />

      {/* Roadmap */}
      <PricingRoadmap />

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 animate-fade-in">
            Start your 7-day free trial today. No credit card required.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6 animate-scale-in hover:scale-105 transition-transform"
          >
            Start Free Trial
            <Sparkles className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Join 10,000+ traders already improving their performance
          </p>
        </div>
      </section>
    </div>
  );
};

// Import the existing Pricing component
import Pricing from "@/components/Pricing";

export default PricingPage;
