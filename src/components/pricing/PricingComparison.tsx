import { Check, X, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const PricingComparison = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  
  const features = [
    {
      categoryKey: "Core Features",
      items: [
        { 
          nameKey: "XP Discipline System", 
          free: "Basic",
          pro: "Full", 
          elite: "Full + Custom Rewards",
          description: "Earn XP points for consistency, build discipline streaks, and unlock higher trading tiers"
        },
        { 
          nameKey: "Trade Upload Speed", 
          free: "Manual",
          pro: "10x faster", 
          elite: "40x faster",
          description: "Upload up to 10 trades at once with AI image recognition. Save hours every week."
        },
        { 
          nameKey: "Analytics", 
          free: "Basic",
          pro: "Advanced", 
          elite: "Pro-level Reports",
          description: "Track win rate, drawdown, expectancy, and consistency metrics in real time"
        },
        { 
          nameKey: "Customization", 
          free: "Limited",
          pro: "Widgets", 
          elite: "Full Dashboard",
          description: "Build your own dashboard with custom widgets for psychology, risk, or PnL metrics"
        },
      ]
    },
    {
      categoryKey: "Support & Security",
      items: [
        { 
          nameKey: "Support", 
          free: "Community",
          pro: "Email", 
          elite: "Priority",
          description: "Get help when you need it, from community forums to dedicated priority support"
        },
        { 
          nameKey: "Privacy & Security", 
          free: "Encrypted",
          pro: "Encrypted", 
          elite: "Encrypted + Backups",
          description: "Your trades are encrypted end-to-end. No exchange connections. Your data stays yours."
        },
      ]
    }
  ];

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-primary mx-auto" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
      );
    }
    // Render the string value directly (not a translation key)
    return <span className="text-[13px] font-medium">{value}</span>;
  };

  return (
    <section ref={ref} className="px-6 mb-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px] pointer-events-none" />
      
      <div className="container mx-auto max-w-6xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 
            className="font-bold leading-tight tracking-tight mb-4"
            style={{ 
              fontSize: 'clamp(28px, 4vw, 42px)',
              letterSpacing: '-0.01em'
            }}
          >
            Complete Feature Comparison
          </h2>
          <p className="text-[17px] text-muted-foreground/80 max-w-2xl mx-auto">
            See exactly what's included in each plan. Hover over features for detailed explanations.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-primary/20 bg-primary/5">
                  <th className="text-left py-4 px-4 font-semibold text-[14px]">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-[14px]">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-[14px]">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold text-[14px]">Elite</th>
                </tr>
              </thead>
              <tbody>
                {features.map((category, categoryIndex) => (
                  <>
                    <tr key={`category-${categoryIndex}`} className="bg-primary/10">
                      <td colSpan={4} className="py-4 px-4 font-semibold text-[13px] uppercase tracking-wide text-primary">
                        {category.categoryKey}
                      </td>
                    </tr>
                    {category.items.map((item, itemIndex) => (
                      <motion.tr
                        key={`item-${categoryIndex}-${itemIndex}`}
                        initial={{ opacity: 0 }}
                        animate={isVisible ? { opacity: 1 } : {}}
                        transition={{ duration: 0.3, delay: (categoryIndex * 0.1) + (itemIndex * 0.05) }}
                        className="border-b border-primary/10 hover:bg-primary/5 transition-colors group relative"
                      >
                        <td className="py-4 px-4 text-[14px]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help">
                                  <span className="group-hover:text-foreground transition-colors">{item.nameKey}</span>
                                  {item.description && (
                                    <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              {item.description && (
                                <TooltipContent className="max-w-xs">
                                  <p className="text-[13px]">{item.description}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="py-4 px-4 text-center">{renderCell(item.free)}</td>
                        <td className="py-4 px-4 text-center">{renderCell(item.pro)}</td>
                        <td className="py-4 px-4 text-center">{renderCell(item.elite)}</td>
                      </motion.tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingComparison;
