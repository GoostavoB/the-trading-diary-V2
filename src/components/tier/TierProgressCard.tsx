import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lock, Check } from 'lucide-react';
import type { TierInfo } from '@/hooks/useTierPreview';

interface TierProgressCardProps {
  tierInfo: TierInfo;
  currentXP: number;
  isUnlocked: boolean;
  isCurrent: boolean;
  index: number;
}

export const TierProgressCard = ({ 
  tierInfo, 
  currentXP, 
  isUnlocked, 
  isCurrent,
  index 
}: TierProgressCardProps) => {
  const progress = isUnlocked ? 100 : Math.min(100, (currentXP / tierInfo.xpRequired) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card 
        className={`relative overflow-hidden transition-all duration-300 ${
          isCurrent ? 'ring-2 ring-primary shadow-lg scale-105' : ''
        } ${!isUnlocked ? 'opacity-70' : ''}`}
      >
        {isCurrent && (
          <div className="absolute top-0 right-0 m-3">
            <Badge className="bg-primary">Current</Badge>
          </div>
        )}
        
        {isUnlocked && !isCurrent && (
          <div className="absolute top-0 right-0 m-3">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <Check size={14} className="text-accent-foreground" />
            </div>
          </div>
        )}

        {!isUnlocked && (
          <div className="absolute top-0 right-0 m-3">
            <Lock size={16} className="text-muted-foreground" />
          </div>
        )}

        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tierInfo.color }}
            />
            <CardTitle className="text-xl">{tierInfo.name}</CardTitle>
          </div>
          <CardDescription>
            {tierInfo.xpRequired.toLocaleString()} XP Required
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {!isUnlocked && currentXP < tierInfo.xpRequired && (
              <p className="text-xs text-muted-foreground">
                {(tierInfo.xpRequired - currentXP).toLocaleString()} XP to unlock
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Benefits:</p>
            <ul className="space-y-2">
              {tierInfo.benefits.slice(0, 3).map((benefit, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + i * 0.05 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="text-lg">{benefit.icon}</span>
                  <div>
                    <p className="font-medium">{benefit.feature}</p>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            {tierInfo.benefits.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{tierInfo.benefits.length - 3} more benefits
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
