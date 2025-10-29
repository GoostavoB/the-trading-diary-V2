import React, { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PricingComparison = () => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      category: t('pricing.comparison.categories.uploads'),
      items: [
        { name: t('pricing.comparison.features.imageUploads'), basic: "5 total (starter gift)", pro: "30/month", elite: "150/month" },
        { name: t('pricing.comparison.features.tradesPerUpload'), basic: "10", pro: "10", elite: "10" },
        { name: t('pricing.comparison.features.extraUploadCost'), basic: "$5 per 10", pro: "$2 per 10", elite: "$1 per 10 (50% off)" },
        { name: t('pricing.comparison.features.manualEntry'), basic: true, pro: true, elite: true },
        { name: t('pricing.comparison.features.csvExport'), basic: true, pro: true, elite: true },
      ]
    },
    {
      category: t('pricing.comparison.categories.accounts'),
      items: [
        { name: t('pricing.comparison.features.connectedAccounts'), basic: "1", pro: "Unlimited", elite: "Unlimited" },
      ]
    },
    {
      category: "XP & Widgets",
      items: [
        { name: "XP System", basic: "Unlimited", pro: "Unlimited", elite: "Unlimited" },
        { name: "Widget Access", basic: "Tiers 1-2", pro: "Tiers 1-4", elite: "All Widgets" },
      ]
    },
    {
      category: "Customization",
      items: [
        { name: "Color Themes", basic: "Default (light/dark)", pro: "Primary, Secondary, Accent", elite: "Full color + background" },
      ]
    },
    {
      category: t('pricing.comparison.categories.features'),
      items: [
        { name: t('pricing.comparison.features.aiInsights'), basic: true, pro: true, elite: true },
        { name: t('pricing.comparison.features.customDashboard'), basic: true, pro: true, elite: true },
        { name: t('pricing.comparison.features.tradingHistory'), basic: true, pro: true, elite: true },
        { name: t('pricing.comparison.features.journal'), basic: true, pro: true, elite: true },
        { name: t('pricing.comparison.features.drawdownAnalysis'), basic: true, pro: true, elite: true },
        { name: t('pricing.comparison.features.leverageCalculator'), basic: true, pro: true, elite: true },
        { name: t('pricing.comparison.features.marketData'), basic: true, pro: true, elite: true },
        { name: t('pricing.comparison.features.equityForecast'), basic: true, pro: true, elite: true },
        { name: t('pricing.comparison.features.feeAnalysis'), basic: false, pro: true, elite: true },
        { name: t('pricing.comparison.features.tradingPlan'), basic: false, pro: true, elite: true },
        { name: t('pricing.comparison.features.goals'), basic: false, pro: true, elite: true },
        { name: t('pricing.comparison.features.psychology'), basic: false, pro: true, elite: true },
        { name: t('pricing.comparison.features.reports'), basic: false, pro: true, elite: true },
        { name: t('pricing.comparison.features.taxReports'), basic: false, pro: true, elite: true },
      ]
    },
    {
      category: t('pricing.comparison.categories.aiMetrics'),
      items: [
        { name: t('pricing.comparison.features.customMetrics'), basic: false, pro: "3/mo", elite: "10/mo" },
      ]
    },
    {
      category: t('pricing.comparison.categories.support'),
      items: [
        { name: t('pricing.comparison.features.emailSupport'), basic: true, pro: true, elite: true },
        { name: t('pricing.comparison.features.prioritySupport'), basic: false, pro: false, elite: true },
        { name: t('pricing.comparison.features.earlyAccess'), basic: false, pro: false, elite: true },
      ]
    },
    {
      category: t('pricing.comparison.categories.extras'),
      items: [
        { name: t('pricing.comparison.features.extraCredits'), basic: "$2/10", pro: "$2/10", elite: "$1/10 (50% off)" },
      ]
    },
  ];

  useEffect(() => {
    if (!containerRef.current || !gridRef.current) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Animate category headers
      gsap.utils.toArray<HTMLElement>('.comparison-category').forEach((category, i) => {
        gsap.from(category, {
          opacity: 0,
          y: 30,
          duration: 0.5,
          scrollTrigger: {
            trigger: category,
            start: 'top 85%',
            end: 'top 65%',
            scrub: 0.5,
          }
        });
      });

      // Animate feature rows with stagger
      gsap.utils.toArray<HTMLElement>('.comparison-row').forEach((row, i) => {
        gsap.from(row, {
          opacity: 0,
          y: 20,
          duration: 0.4,
          scrollTrigger: {
            trigger: row,
            start: 'top 90%',
            end: 'top 75%',
            scrub: 0.5,
          }
        });
      });

      // Background grid fade in
      if (gridRef.current) {
        gsap.to(gridRef.current, {
          opacity: 0.06,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 60%',
            end: 'top 30%',
            scrub: 1,
          }
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          whileInView={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true }}
        >
          <Check className="w-5 h-5 text-primary mx-auto" />
        </motion.div>
      ) : (
        <X className="w-5 h-5 text-muted-foreground/20 mx-auto" />
      );
    }
    return <span className="text-sm font-medium">{value}</span>;
  };

  return (
    <section ref={containerRef} className="relative py-24 px-6 overflow-hidden">
      {/* Background grid pattern */}
      <div 
        ref={gridRef}
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            {t('pricing.comparison.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-muted-foreground"
          >
            {t('pricing.comparison.subtitle')}
          </motion.p>
        </div>

        {/* Guarantee Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/5 backdrop-blur-sm border border-primary/20 rounded-full">
            <Check className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">
              No credit card required • Upgrade anytime • Offer ending soon
            </span>
          </div>
        </motion.div>

        {/* Comparison Grid */}
        <div className="space-y-8">
          {/* Sticky Header - Desktop */}
          <div className="hidden md:block sticky top-20 z-20 backdrop-blur-xl bg-background/80 rounded-2xl border border-border/50 p-6 mb-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Feature
              </div>
              <div className="text-center text-sm font-bold">Free</div>
              <div className="text-center text-sm font-bold relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full whitespace-nowrap">
                  Most Popular
                </div>
                Pro
              </div>
              <div className="text-center text-sm font-bold">Elite</div>
            </div>
          </div>
          
          {/* Mobile: Scrollable Header */}
          <div className="md:hidden sticky top-20 z-20 backdrop-blur-xl bg-background/80 rounded-2xl border border-border/50 p-4 mb-6 overflow-x-auto">
            <div className="grid grid-cols-4 gap-4 min-w-[600px]">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Feature
              </div>
              <div className="text-center text-xs font-bold">Free</div>
              <div className="text-center text-xs font-bold relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-medium rounded-full whitespace-nowrap">
                  Popular
                </div>
                Pro
              </div>
              <div className="text-center text-xs font-bold">Elite</div>
            </div>
          </div>

          {/* Feature Categories */}
          {features.map((category, categoryIdx) => (
            <div key={categoryIdx} className="space-y-3">
              {/* Category Header */}
              <div className="comparison-category backdrop-blur-sm bg-card/30 rounded-xl border border-primary/20 p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                  {category.category}
                </h3>
              </div>

              {/* Feature Rows */}
              {category.items.map((item, itemIdx) => (
                <div 
                  key={itemIdx}
                  className="comparison-row backdrop-blur-md bg-card/40 rounded-xl border border-border/50 p-3 md:p-5 hover:border-primary/30 hover:bg-card/60 transition-all duration-300 group overflow-x-auto"
                >
                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-4 gap-4 items-center">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-center group-hover:scale-105 transition-transform">{renderCell(item.basic)}</div>
                    <div className="text-center bg-primary/5 rounded-lg py-2 group-hover:bg-primary/10 group-hover:scale-105 transition-all">{renderCell(item.pro)}</div>
                    <div className="text-center group-hover:scale-105 transition-transform">{renderCell(item.elite)}</div>
                  </div>
                  
                  {/* Mobile: Horizontal scroll layout */}
                  <div className="md:hidden grid grid-cols-4 gap-3 items-center min-w-[600px]">
                    <div className="font-medium text-xs pr-2">{item.name}</div>
                    <div className="text-center">{renderCell(item.basic)}</div>
                    <div className="text-center bg-primary/5 rounded-lg py-1.5">{renderCell(item.pro)}</div>
                    <div className="text-center">{renderCell(item.elite)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingComparison;
