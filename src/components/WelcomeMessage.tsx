import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Sun, Sunset, Moon, TrendingUp } from 'lucide-react';

export const WelcomeMessage = () => {
  const { user } = useAuth();
  const { xpData } = useXPSystem();
  const { challenges } = useDailyChallenges();
  const [xpGainedToday, setXPGainedToday] = useState(0);
  const [greeting, setGreeting] = useState('');
  const [timeIcon, setTimeIcon] = useState<any>(Sun);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
      setTimeIcon(Sun);
    } else if (hour < 18) {
      setGreeting('Good afternoon');
      setTimeIcon(Sunset);
    } else {
      setGreeting('Good evening');
      setTimeIcon(Moon);
    }
  }, []);

  useEffect(() => {
    // Calculate XP gained today (placeholder - would need actual logic)
    // For now, use a simple estimation
    setXPGainedToday(0);
  }, [xpData]);

  const completedChallenges = challenges.filter(c => c.isCompleted).length;
  const userName = user?.email?.split('@')[0] || 'Trader';

  const TimeIconComponent = timeIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 glass">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TimeIconComponent className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">
                {greeting}, {userName}!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                You've completed {completedChallenges} of {challenges.length} challenges today
                {xpGainedToday > 0 && ` • +${xpGainedToday} XP since yesterday`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">
              Level {xpData.currentLevel}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
