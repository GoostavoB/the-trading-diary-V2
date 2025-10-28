import { Check, X, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";

const PricingComparison = () => {
  const { t } = useTranslation();
  
  const features = [
    {
      categoryKey: "pricingComparison.categories.results",
      items: [
        { nameKey: "pricingComparison.features.winRateTracking", basic: true, pro: true, elite: true },
        { nameKey: "pricingComparison.features.maxWeeklyDrawdown", basic: false, pro: true, elite: true },
        { nameKey: "pricingComparison.features.costImpactAnalysis", basic: false, pro: true, elite: true }
      ]
    },
    {
      categoryKey: "pricingComparison.categories.dataCapture",
      items: [
        { nameKey: "pricingComparison.features.csvUploads", basic: true, pro: true, elite: true },
        { nameKey: "pricingComparison.features.screenshotOcr", basic: true, pro: true, elite: true },
        { nameKey: "pricingComparison.features.aiAccuracyTier", basic: "pricingComparison.tiers.standard", pro: "pricingComparison.tiers.enhanced", elite: "pricingComparison.tiers.premium" },
        { nameKey: "pricingComparison.features.customFields", basic: false, pro: true, elite: true }
      ]
    },
    {
      categoryKey: "pricingComparison.categories.riskTools",
      items: [
        { nameKey: "pricingComparison.features.leverageCalculator", basic: false, pro: true, elite: true },
        { nameKey: "pricingComparison.features.preTradeChecklist", basic: false, pro: true, elite: true },
        { nameKey: "pricingComparison.features.riskAlerts", basic: false, pro: true, elite: true }
      ]
    },
    {
      categoryKey: "pricingComparison.categories.costs",
      items: [
        { nameKey: "pricingComparison.features.feesDashboard", basic: false, pro: true, elite: true },
        { nameKey: "pricingComparison.features.makerTakerSimulation", basic: false, pro: true, elite: true },
        { nameKey: "pricingComparison.features.fundingRebates", basic: false, pro: true, elite: true }
      ]
    },
    {
      categoryKey: "pricingComparison.categories.analytics",
      items: [
        { nameKey: "pricingComparison.features.weeklyHeatmap", basic: true, pro: true, elite: true },
        { nameKey: "pricingComparison.features.bestAssetsHours", basic: true, pro: true, elite: true },
        { nameKey: "pricingComparison.features.mfeMaeExpectancy", basic: false, pro: false, elite: true }
      ]
    },
    {
      categoryKey: "pricingComparison.categories.ops",
      items: [
        { nameKey: "pricingComparison.features.weeklyEmailReports", basic: false, pro: false, elite: true },
        { nameKey: "pricingComparison.features.exportCsvPdf", basic: false, pro: false, elite: true },
        { nameKey: "pricingComparison.features.integrations", basic: "pricingComparison.tiers.oneExchange", pro: "pricingComparison.tiers.threeExchanges", elite: "pricingComparison.tiers.fiveExchanges", tooltipKey: "pricingComparison.features.integrationsTooltip" }
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
    // If value is a translation key, translate it
    return <span className="text-sm">{t(value)}</span>;
  };

  return (
    <section className="px-6 mb-16">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-8">{t('pricingComparison.title')}</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-primary/20">
                <th className="text-left py-4 px-4 font-semibold">{t('pricingComparison.feature')}</th>
                <th className="text-center py-4 px-4 font-semibold">{t('pricingComparison.basic')}</th>
                <th className="text-center py-4 px-4 font-semibold">{t('pricingComparison.pro')}</th>
                <th className="text-center py-4 px-4 font-semibold">{t('pricingComparison.elite')}</th>
              </tr>
            </thead>
            <tbody>
              {features.map((category, categoryIndex) => (
                <>
                  <tr key={`category-${categoryIndex}`} className="bg-primary/5">
                    <td colSpan={4} className="py-3 px-4 font-semibold text-sm uppercase tracking-wide">
                      {t(category.categoryKey)}
                    </td>
                  </tr>
                  {category.items.map((item, itemIndex) => (
                    <tr key={`item-${categoryIndex}-${itemIndex}`} className="border-b border-primary/10 hover:bg-secondary/20">
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          {t(item.nameKey)}
                          {item.tooltipKey && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t(item.tooltipKey)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{renderCell(item.basic)}</td>
                      <td className="py-3 px-4 text-center">{renderCell(item.pro)}</td>
                      <td className="py-3 px-4 text-center">{renderCell(item.elite)}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default PricingComparison;
