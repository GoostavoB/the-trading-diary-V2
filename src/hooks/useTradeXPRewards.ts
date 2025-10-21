import { useEffect, useRef } from 'react';
import { useXPSystem } from './useXPSystem';
import { supabase } from '@/integrations/supabase/client';
import type { Trade } from '@/types/trade';
import { addXPNotification } from '@/components/gamification/FloatingXP';
import { triggerMicroFeedback } from '@/components/gamification/MicroFeedbackOverlay';

export const useTradeXPRewards = (trades: Trade[]) => {
  const { addXP } = useXPSystem();
  const processingRef = useRef(false);

  useEffect(() => {
    const processUnrewardedTrades = async () => {
      // Prevent multiple simultaneous processing
      if (processingRef.current || !trades || trades.length === 0) return;
      processingRef.current = true;

      try {
        // Find trades that haven't been awarded XP yet
        const unrewardedTrades = trades.filter(trade => 
          trade.id && !trade.xp_awarded
        );

        if (unrewardedTrades.length === 0) {
          processingRef.current = false;
          return;
        }

        // Process each unrewarded trade
        for (const trade of unrewardedTrades) {
          if (!trade.id) continue;

          let totalXPForTrade = 0;
          
          // Base XP for completing a trade (10 XP)
          await addXP(10, 'trade_completed', `Traded ${trade.symbol}`);
          addXPNotification(10, `Traded ${trade.symbol}`);
          triggerMicroFeedback('xp', '+10 XP');
          totalXPForTrade += 10;

          // Bonus XP for winning trades
          const pnl = trade.pnl || 0;
          if (pnl > 0) {
            // Award XP based on profit (1 XP per $10 profit, max 50 XP)
            const winXP = Math.min(Math.floor(pnl / 10), 50);
            if (winXP > 0) {
              await addXP(winXP, 'winning_trade', `Profit: $${pnl.toFixed(2)}`);
              addXPNotification(winXP, `Winning trade: $${pnl.toFixed(2)}`);
              triggerMicroFeedback('profit', `+$${pnl.toFixed(2)}`);
              totalXPForTrade += winXP;
            }
          } else if (pnl < 0) {
            // Small XP for losses (participation reward)
            await addXP(3, 'trade_participation', 'Learning experience');
            triggerMicroFeedback('loss', `$${pnl.toFixed(2)}`);
            totalXPForTrade += 3;
          }

          // Bonus XP for excellent ROI (>5%)
          const roi = trade.roi || 0;
          if (roi > 5) {
            await addXP(20, 'excellent_roi', `ROI: ${roi.toFixed(1)}%`);
            addXPNotification(20, `Excellent ROI: ${roi.toFixed(1)}%`);
            totalXPForTrade += 20;
          } else if (roi > 3) {
            await addXP(10, 'good_roi', `ROI: ${roi.toFixed(1)}%`);
            addXPNotification(10, `Good ROI: ${roi.toFixed(1)}%`);
            totalXPForTrade += 10;
          }

          // Bonus for adding detailed notes (5 XP)
          if (trade.notes && trade.notes.length > 50) {
            await addXP(5, 'detailed_notes', 'Added detailed trade notes');
            totalXPForTrade += 5;
          }

          // Bonus for adding screenshot (5 XP)
          if (trade.screenshot_url || trade.image_url) {
            await addXP(5, 'trade_screenshot', 'Added trade screenshot');
            totalXPForTrade += 5;
          }

          // Bonus for proper setup tagging (5 XP)
          if (trade.setup && trade.setup.trim().length > 0) {
            await addXP(5, 'setup_tagged', `Setup: ${trade.setup}`);
            totalXPForTrade += 5;
          }

          // Mark trade as XP awarded in database
          await supabase
            .from('trades')
            .update({ xp_awarded: true })
            .eq('id', trade.id);
        }
      } catch (error) {
        console.error('Error processing trade XP rewards:', error);
      } finally {
        processingRef.current = false;
      }
    };

    processUnrewardedTrades();
  }, [trades, addXP]);
};
