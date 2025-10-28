import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import type { TierInfo } from '@/hooks/useTierPreview';

interface TierBenefitsComparisonProps {
  tierData: TierInfo[];
  currentTier: string;
}

export const TierBenefitsComparison = ({ tierData, currentTier }: TierBenefitsComparisonProps) => {
  // Collect all unique features across all tiers
  const allFeatures = Array.from(
    new Set(tierData.flatMap(tier => tier.benefits.map(b => b.feature)))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Feature</th>
                {tierData.map((tier, index) => (
                  <th 
                    key={tier.level}
                    className={`text-center p-3 font-medium ${
                      tier.level === currentTier ? 'bg-primary/10' : ''
                    }`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {tier.name}
                    </motion.div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFeatures.map((feature, featureIndex) => (
                <motion.tr
                  key={feature}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: featureIndex * 0.05 }}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <td className="p-3 text-sm">{feature}</td>
                  {tierData.map(tier => {
                    const hasFeature = tier.benefits.some(b => b.feature === feature);
                    return (
                      <td 
                        key={`${tier.level}-${feature}`}
                        className={`text-center p-3 ${
                          tier.level === currentTier ? 'bg-primary/5' : ''
                        }`}
                      >
                        {hasFeature ? (
                          <Check size={18} className="inline text-accent" />
                        ) : (
                          <X size={18} className="inline text-muted-foreground/30" />
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
