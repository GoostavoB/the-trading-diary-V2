/**
 * Token color mapping for consistent chart colors
 * Uses deterministic HSL fallback for unknown tokens
 */

export const TOKEN_COLORS: Record<string, string> = {
  // Major cryptocurrencies
  BTC: '#F7931A',
  ETH: '#627EEA',
  BNB: '#F3BA2F',
  SOL: '#14F195',
  XRP: '#23292F',
  ADA: '#0033AD',
  DOGE: '#C2A633',
  DOT: '#E6007A',
  MATIC: '#8247E5',
  AVAX: '#E84142',
  LINK: '#2A5ADA',
  UNI: '#FF007A',
  ATOM: '#2E3148',
  LTC: '#345D9D',
  NEAR: '#00C1DE',
  ALGO: '#000000',
  VET: '#15BDFF',
  ICP: '#29ABE2',
  FIL: '#0090FF',
  APT: '#00D4AA',
  QNT: '#0080FF',
  HBAR: '#000000',
  ARB: '#28A0F0',
  OP: '#FF0420',
  IMX: '#000000',
  INJ: '#00F2FE',
  RUNE: '#00CCFF',
  MKR: '#1AAB9B',
  GRT: '#6747ED',
  AAVE: '#B6509E',
  THETA: '#2AB8E6',
  FTM: '#1969FF',
  XLM: '#000000',
  SAND: '#04ADEF',
  MANA: '#FF2D55',
  AXS: '#0055D5',
  EGLD: '#000000',
  XTZ: '#2C7DF7',
  FLOW: '#00EF8B',
  EOS: '#000000',
  KLAY: '#FF3D00',
  CHZ: '#CD0124',
  ZEC: '#F4B728',
  DASH: '#008CE7',
  NEO: '#58BF00',
  IOTA: '#000000',
  KSM: '#000000',
  COMP: '#00D395',
  ENJ: '#7866D5',
  BAT: '#FF5000',
  ZIL: '#49C1BF',
  // Stablecoins
  USDT: '#26A17B',
  USDC: '#2775CA',
  BUSD: '#F0B90B',
  DAI: '#F4B731',
  TUSD: '#002868',
  FRAX: '#000000',
  USDP: '#000000',
};

/**
 * Generate deterministic HSL color from string hash
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get color for a token symbol
 * Returns predefined color or generates deterministic fallback
 */
export function getTokenColor(symbol: string, isDarkMode = true): string {
  const upperSymbol = symbol.toUpperCase();
  
  if (TOKEN_COLORS[upperSymbol]) {
    return TOKEN_COLORS[upperSymbol];
  }
  
  // Generate deterministic HSL color
  const hash = hashString(upperSymbol);
  const hue = hash % 360;
  const saturation = 60 + (hash % 20); // 60-80%
  const lightness = isDarkMode ? (50 + (hash % 15)) : (40 + (hash % 15)); // Brighter in dark mode
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get contrasting text color for a background color
 */
export function getContrastColor(bgColor: string): string {
  // Simple contrast calculation - for production, use a more sophisticated algorithm
  return '#FFFFFF'; // Default to white for now
}
