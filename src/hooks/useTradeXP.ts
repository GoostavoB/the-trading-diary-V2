import { useEffect, useRef } from 'react';
import { useXPSystem } from './useXPSystem';
import { useDailyChallenges } from './useDailyChallenges';
import type { Trade } from '@/types/trade';
import { calculateTradePnL, calculateTotalPnL } from '@/utils/pnl';

export const useTradeXP = (trades: Trade[]) => {
  const { addXP } = useXPSystem();
  const { updateChallengeProgress } = useDailyChallenges();
  const processedTradesRef = useRef(new Set<string>());

  useEffect(() => {
    if (!trades || trades.length === 0) return;

    // Process only new trades
    const newTrades = trades.filter(
      trade => trade.id && !processedTradesRef.current.has(trade.id)
    );

    if (newTrades.length === 0) return;

    // Award XP for new trades
    newTrades.forEach(trade => {
      if (trade.id) {
        processedTradesRef.current.add(trade.id);
        
        // Base XP for completing a trade
        addXP(10, 'trade_completed', `Trade on ${trade.symbol}`);

        // Bonus XP for winning trades
        const tradePnL = calculateTradePnL(trade, { includeFees: true });
        if (tradePnL > 0) {
          const winXP = Math.min(Math.floor(tradePnL / 10), 50); // Max 50 XP per win
          addXP(winXP, 'winning_trade', `Profit: $${tradePnL.toFixed(2)}`);
        }

        // Bonus XP for good risk management (ROI > 3%)
        if ((trade.roi || 0) > 3) {
          addXP(15, 'good_roi', `ROI: ${trade.roi?.toFixed(1)}%`);
        }

        // Bonus for adding notes
        if (trade.notes && trade.notes.length > 50) {
          addXP(5, 'detailed_notes', 'Added detailed trade notes');
        }
      }
    });

    // Update daily challenges
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(
      t => new Date(t.trade_date).toISOString().split('T')[0] === today
    );

    // Trade count challenge
    updateChallengeProgress('trade_count', todayTrades.length);

    // Win streak challenge
    const sortedTodayTrades = todayTrades.sort(
      (a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()
    );
    let winStreak = 0;
    for (const trade of sortedTodayTrades) {
      if (calculateTradePnL(trade, { includeFees: true }) > 0) {
        winStreak++;
      } else {
        break;
      }
    }
    updateChallengeProgress('win_rate', winStreak);

    // Profit target challenge
    const todayProfit = calculateTotalPnL(todayTrades, { includeFees: true });
    updateChallengeProgress('profit_target', Math.floor(todayProfit));

  }, [trades, addXP, updateChallengeProgress]);
};
