/**
 * Category color mapping for consistent chart colors
 * Uses deterministic HSL fallback for unknown categories
 */

export const CATEGORY_COLORS: Record<string, string> = {
  // Top CoinGecko categories
  'Layer 1': '#3B82F6',
  'DeFi': '#10B981',
  'AI': '#8B5CF6',
  'Stablecoins': '#6B7280',
  'Meme': '#F59E0B',
  'Gaming': '#EC4899',
  'NFT': '#8B5CF6',
  'Metaverse': '#06B6D4',
  'Exchange': '#3B82F6',
  'Oracle': '#2563EB',
  'Privacy': '#374151',
  'Storage': '#0891B2',
  'Lending': '#059669',
  'DEX': '#10B981',
  'Yield Farming': '#84CC16',
  'Derivatives': '#F97316',
  'Insurance': '#0EA5E9',
  'Payments': '#6366F1',
  'Smart Contract Platform': '#7C3AED',
  'Infrastructure': '#1F2937',
  'Real World Assets': '#DC2626',
  'Fan Token': '#EF4444',
  'Launchpad': '#F59E0B',
  'Wrapped': '#78716C',
  'Uncategorized': '#9CA3AF',
};

/**
 * Generate deterministic HSL color from string hash
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Get color for a category
 * Returns predefined color or generates deterministic fallback
 */
export function getCategoryColor(category: string, isDarkMode = true): string {
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  
  // Generate deterministic HSL color
  const hash = hashString(category);
  const hue = hash % 360;
  const saturation = 55 + (hash % 25); // 55-80%
  const lightness = isDarkMode ? (45 + (hash % 20)) : (35 + (hash % 20));
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get all category colors for a list of categories
 */
export function getCategoryColors(categories: string[], isDarkMode = true): Record<string, string> {
  return categories.reduce((acc, category) => {
    acc[category] = getCategoryColor(category, isDarkMode);
    return acc;
  }, {} as Record<string, string>);
}
