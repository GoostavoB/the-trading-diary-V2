export const TRADING_ACRONYMS: Record<string, string> = {
  'LSR': 'Long/Short Ratio',
  'PnL': 'Profit and Loss',
  'ROI': 'Return on Investment',
  'WR': 'Win Rate',
  'DD': 'Drawdown',
  'SL': 'Stop Loss',
  'TP': 'Take Profit',
  'DCA': 'Dollar Cost Averaging',
  'FOMO': 'Fear Of Missing Out',
  'ATH': 'All-Time High',
  'ATL': 'All-Time Low',
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'USDT': 'Tether',
  'USDC': 'USD Coin',
  'MA': 'Moving Average',
  'EMA': 'Exponential Moving Average',
  'SMA': 'Simple Moving Average',
  'RSI': 'Relative Strength Index',
  'MACD': 'Moving Average Convergence Divergence',
  'BB': 'Bollinger Bands',
  'ATR': 'Average True Range',
  'VOL': 'Volume',
  'OI': 'Open Interest',
  'FR': 'Funding Rate',
  'CEX': 'Centralized Exchange',
  'DEX': 'Decentralized Exchange',
  'KYC': 'Know Your Customer',
  'AML': 'Anti-Money Laundering',
  'P2P': 'Peer to Peer',
  'API': 'Application Programming Interface',
  'HOD': 'Hold On for Dear Life',
  'HODL': 'Hold On for Dear Life',
  'FUD': 'Fear, Uncertainty, and Doubt',
  'BTFD': 'Buy The Dip',
  'GM': 'Good Morning',
  'GN': 'Good Night',
  'WAGMI': 'We Are All Going to Make It',
  'NGMI': 'Not Going to Make It',
  'LFG': 'Let\'s Go',
  'IMO': 'In My Opinion',
  'IMHO': 'In My Humble Opinion',
  'NFA': 'Not Financial Advice',
  'DYOR': 'Do Your Own Research',
  'TL;DR': 'Too Long; Didn\'t Read',
  'TLDR': 'Too Long; Didn\'t Read',
};

/**
 * Preprocesses user message to expand trading acronyms for better AI understanding
 */
export const preprocessUserMessage = (message: string): string => {
  let processed = message;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedAcronyms = Object.entries(TRADING_ACRONYMS)
    .sort(([a], [b]) => b.length - a.length);
  
  sortedAcronyms.forEach(([acronym, expansion]) => {
    // Match whole words only, case insensitive
    const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
    processed = processed.replace(regex, (match) => {
      // Preserve original casing in the match
      return `${match} (${expansion})`;
    });
  });
  
  return processed;
};

/**
 * Generates a glossary prompt for AI context
 */
export const getGlossaryPrompt = (): string => {
  const glossaryList = Object.entries(TRADING_ACRONYMS)
    .map(([acronym, expansion]) => `- ${acronym} = ${expansion}`)
    .join('\n');
  
  return `Common trading terms and acronyms:\n${glossaryList}`;
};
