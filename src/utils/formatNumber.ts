export const formatNumber = (value: number): string => {
  if (!value && value !== 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(1)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(2);
};

export const formatPercent = (value: number): string => {
  if (!value && value !== 0) return '0%';
  const absValue = Math.abs(value);
  return absValue > 10 ? `${value.toFixed(1)}%` : `${value.toFixed(2)}%`;
};

export const formatCurrency = (value: number, currency: string = '$'): string => {
  return `${currency}${formatNumber(value)}`;
};
