import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RollingTargetWidget } from '@/components/widgets/RollingTargetWidget';
import { Card } from '@/components/ui/card';
import { Target, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trade } from '@/types/trade';

export const TradeStationRollingTarget = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch trades
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (tradesData) {
        setTrades(tradesData.map(trade => ({
          ...trade,
          side: trade.side as 'long' | 'short' | null
        })));
      }

      // Fetch initial investment
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('initial_investment')
        .eq('user_id', user.id)
        .single();

      if (settingsData) {
        setInitialInvestment(settingsData.initial_investment || 0);
      }
    } catch (error) {
      console.error('Error fetching rolling target data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Help Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Rolling Target Tracker
        </h3>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              What is this?
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Rolling Target Tracker - Your Growth Companion
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold mb-2 text-primary">🎯 What It Does</h4>
                <p className="text-sm text-muted-foreground">
                  Tracks your daily trading progress toward a consistent, compound growth target. 
                  It shows you exactly what you need to earn each day to stay on track with your goals.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-primary">💡 Why It's Powerful</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Prevents FOMO:</strong> Removes pressure to "make up for losses" with risky trades</li>
                  <li>• <strong>Realistic Goals:</strong> Keeps your expectations grounded in achievable targets</li>
                  <li>• <strong>Compound Mindset:</strong> Shows how small, consistent gains create massive returns</li>
                  <li>• <strong>Visual Progress:</strong> See exactly where you stand vs. your planned path</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-primary">🏆 Pro Recommendation</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Professional traders recommend 1% daily growth</strong> (default setting). 
                  This may sound small, but the math is powerful:
                </p>
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <p>• <strong>1% daily = 37.8x your capital in 1 year</strong></p>
                  <p>• <strong>0.5% daily = 6.1x your capital in 1 year</strong></p>
                  <p>• <strong>2% daily = 1,377x your capital in 1 year</strong></p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Formula: (1 + daily%)^365 = annual growth multiple
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Note:</strong> In per-day mode, the "Required" amount compounds daily—it's calculated as your target % of each day's starting capital, which includes previous gains. This is how small percentages create exponential growth.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-primary">⚙️ Flexibility</h4>
                <p className="text-sm text-muted-foreground">
                  You can customize the target percentage in settings to match your trading style, 
                  risk tolerance, and experience level. Start conservative, then adjust as you improve.
                </p>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Remember:</strong> Sustainable, consistent growth beats volatile home runs every time. 
                  This tool helps you stay disciplined and focused on the long game.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Widget */}
      <RollingTargetWidget
        id="tradestation-rolling-target"
        trades={trades}
        initialInvestment={initialInvestment}
      />
    </div>
  );
};
