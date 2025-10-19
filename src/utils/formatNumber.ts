export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(absValue >= 10_000_000_000 ? 0 : 1)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(absValue >= 10_000_000 ? 0 : 1)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(absValue >= 10_000 ? 0 : 1)}K`;
  }
  if (absValue >= 100) {
    return `${sign}${absValue.toFixed(0)}`;
  }
  return value.toFixed(2);
};

export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  const absValue = Math.abs(value);
  
  if (absValue >= 100) {
    return `${value.toFixed(0)}%`;
  }
  return absValue >= 10 ? `${value.toFixed(1)}%` : `${value.toFixed(2)}%`;
};

export const formatCurrency = (value: number | null | undefined, currency: string = '$'): string => {
  return `${currency}${formatNumber(value)}`;
};
