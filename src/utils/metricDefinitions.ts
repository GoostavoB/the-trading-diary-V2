/**
 * Centralized metric definitions for consistency across the app
 * Provides standardized descriptions, calculations, and examples
 */

export interface MetricDefinition {
  title: string;
  description: string;
  calculation: string;
  example?: string;
  interpretation?: string;
}

export const metricDefinitions: Record<string, MetricDefinition> = {
  totalPnL: {
    title: 'Total P&L',
    description: 'Your total profit or loss across all trades. This is the sum of all realized gains and losses.',
    calculation: 'Sum of all (Exit Price - Entry Price) × Position Size',
    example: 'If you made $500 on 3 winning trades and lost $200 on 2 losing trades, your total P&L is $300.',
    interpretation: 'Positive values indicate overall profitability. Track this over time to measure growth.',
  },
  
  winRate: {
    title: 'Win Rate',
    description: 'The percentage of your trades that resulted in a profit. A key metric for measuring consistency.',
    calculation: '(Winning Trades ÷ Total Trades) × 100',
    example: 'If you have 70 winning trades out of 100 total, your win rate is 70%.',
    interpretation: 'Professional traders typically maintain 50-60% win rates. Focus on risk/reward, not just win rate.',
  },
  
  avgWin: {
    title: 'Average Win',
    description: 'The average profit amount from your winning trades. Indicates typical profit per successful trade.',
    calculation: 'Sum of all Winning Trades ÷ Number of Wins',
    example: 'If you made $300, $450, and $600 on 3 wins, your average win is $450.',
    interpretation: 'Should be higher than average loss for long-term profitability.',
  },
  
  avgLoss: {
    title: 'Average Loss',
    description: 'The average loss amount from your losing trades. Important for risk management.',
    calculation: 'Sum of all Losing Trades ÷ Number of Losses',
    example: 'If you lost $100, $150, and $200 on 3 losses, your average loss is $150.',
    interpretation: 'Keep this controlled through proper stop losses and position sizing.',
  },
  
  profitFactor: {
    title: 'Profit Factor',
    description: 'Ratio of total profit to total loss. Shows how much you make for every dollar lost.',
    calculation: 'Total Gross Profit ÷ Total Gross Loss',
    example: 'If you made $5,000 in profits and lost $2,000, your profit factor is 2.5.',
    interpretation: 'Above 1.5 is good, above 2.0 is excellent. Below 1.0 means losing overall.',
  },
  
  sharpeRatio: {
    title: 'Sharpe Ratio',
    description: 'Measures risk-adjusted returns. Higher values indicate better returns per unit of risk.',
    calculation: '(Average Return - Risk-Free Rate) ÷ Standard Deviation of Returns',
    example: 'A Sharpe ratio of 2.0 means you earn 2% excess return for every 1% of risk taken.',
    interpretation: 'Above 1.0 is good, above 2.0 is very good, above 3.0 is excellent.',
  },
  
  maxDrawdown: {
    title: 'Maximum Drawdown',
    description: 'The largest peak-to-trough decline in your account balance. Measures worst-case scenario.',
    calculation: '(Peak Balance - Trough Balance) ÷ Peak Balance × 100',
    example: 'If your balance peaked at $10,000 and dropped to $8,000, max drawdown is 20%.',
    interpretation: 'Keep below 20% for sustainable trading. Lower is better for longevity.',
  },
  
  expectancy: {
    title: 'Expectancy',
    description: 'The average amount you can expect to win or lose per trade. Critical for long-term success.',
    calculation: '(Win Rate × Avg Win) - (Loss Rate × Avg Loss)',
    example: 'With 60% win rate, $500 avg win, and $300 avg loss: (0.6 × $500) - (0.4 × $300) = $180',
    interpretation: 'Positive expectancy means profitable over time. Higher is better.',
  },
  
  avgDuration: {
    title: 'Average Duration',
    description: 'The typical time you hold positions. Helps identify your trading style.',
    calculation: 'Sum of all Trade Durations ÷ Total Trades',
    example: 'If you held 5 trades for 2, 4, 6, 3, and 5 hours, average is 4 hours.',
    interpretation: 'Shorter = day trading, medium = swing trading, longer = position trading.',
  },
  
  roi: {
    title: 'Return on Investment',
    description: 'The percentage return on your initial capital. Shows capital efficiency.',
    calculation: '(Total P&L ÷ Initial Investment) × 100',
    example: 'If you started with $10,000 and made $2,000, your ROI is 20%.',
    interpretation: 'Annual ROI above 15% is considered good. Compare to your risk tolerance.',
  },
  
  bestTrade: {
    title: 'Best Trade',
    description: 'Your largest winning trade. Shows your maximum profit potential.',
    calculation: 'Maximum single trade profit',
    example: 'Your best trade might be a $1,200 profit on a well-timed entry.',
    interpretation: 'Useful for understanding your upside, but focus on consistency over outliers.',
  },
  
  worstTrade: {
    title: 'Worst Trade',
    description: 'Your largest losing trade. Important for understanding your maximum risk.',
    calculation: 'Maximum single trade loss',
    example: 'Your worst trade might be a $400 loss from a stopped-out position.',
    interpretation: 'Should not exceed 2-5% of your account. Review these trades to avoid repeating mistakes.',
  },
  
  currentStreak: {
    title: 'Current Streak',
    description: 'Your ongoing sequence of consecutive winning or losing trades.',
    calculation: 'Count of consecutive wins or losses from most recent trade',
    example: 'If your last 3 trades were all wins, you have a 3-trade winning streak.',
    interpretation: 'Long losing streaks may signal strategy issues. Long winning streaks need protection.',
  },
  
  totalTrades: {
    title: 'Total Trades',
    description: 'The complete number of trades you have executed. Indicates experience level.',
    calculation: 'Count of all completed trades',
    example: '100 trades provides statistically relevant data for analysis.',
    interpretation: 'More trades = more data for analysis. Aim for at least 30 trades for meaningful stats.',
  },
  
  avgRiskReward: {
    title: 'Average Risk/Reward Ratio',
    description: 'The ratio of potential profit to potential loss across your trades.',
    calculation: 'Average Win ÷ Average Loss',
    example: 'If avg win is $300 and avg loss is $150, your risk/reward is 2:1.',
    interpretation: 'Aim for 2:1 or higher. Allows for profitability even with 50% win rate.',
  },
  
  simpleAvgROI: {
    title: 'Simple Average ROI',
    description: 'This metric shows the average return per trade. It treats every trade with the same weight.',
    calculation: 'Sum of ROI percentages of all trades, divided by the number of trades.',
    example: 'Trade ROIs: 5%, 10%, 20%. Simple Average ROI: 11.67%',
    interpretation: 'You see how your trading decisions perform on average. A higher value means your typical trade produces a positive return. Use it to track the quality and consistency of your entries and exits.',
  },
  
  weightedAvgROI: {
    title: 'Weighted Average ROI',
    description: 'This metric shows the return relative to how much capital you use in each trade. Larger positions influence the number more than smaller ones.',
    calculation: 'Sum of (ROI percentage × position size) divided by the total capital allocated across the trades.',
    example: 'Trades: 5% ROI with €1000, 10% ROI with €5000, 20% ROI with €500. Weighted Average ROI: 9.4%',
    interpretation: 'You see the real impact of your trading on your account. A higher value means your capital allocation supports profitable trades. Use it to evaluate risk sizing and exposure quality.',
  },
};

/**
 * Get metric definition by key
 */
export const getMetricDefinition = (key: string): MetricDefinition | undefined => {
  return metricDefinitions[key];
};

/**
 * Get all metric keys
 */
export const getMetricKeys = (): string[] => {
  return Object.keys(metricDefinitions);
};
