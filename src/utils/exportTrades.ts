import type { Trade } from '@/types/trade';
import { format } from 'date-fns';

export const exportToCSV = (trades: Trade[], filename: string = 'trades') => {
  if (!trades.length) return;

  // Define CSV headers
  const headers = [
    'Date',
    'Symbol',
    'Side',
    'Entry Price',
    'Exit Price',
    'Position Size',
    'Leverage',
    'Margin',
    'P&L',
    'ROI (%)',
    'Duration (minutes)',
    'Funding Fee',
    'Trading Fee',
    'Broker',
    'Setup',
    'Emotional Tag',
    'Period of Day',
    'Notes'
  ];

  // Convert trades to CSV rows
  const rows = trades.map(trade => [
    trade.trade_date ? format(new Date(trade.trade_date), 'yyyy-MM-dd HH:mm:ss') : '',
    trade.symbol || '',
    trade.side || '',
    trade.entry_price?.toString() || '',
    trade.exit_price?.toString() || '',
    trade.position_size?.toString() || '',
    trade.leverage?.toString() || '',
    trade.margin?.toString() || '',
    trade.pnl?.toString() || '',
    trade.roi?.toString() || '',
    trade.duration_minutes?.toString() || '',
    trade.funding_fee?.toString() || '',
    trade.trading_fee?.toString() || '',
    trade.broker || '',
    trade.setup || '',
    trade.emotional_tag || '',
    trade.period_of_day || '',
    trade.notes?.replace(/"/g, '""') || '' // Escape quotes in notes
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (trades: Trade[], filename: string = 'trades') => {
  if (!trades.length) return;

  const jsonContent = JSON.stringify(trades, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateTradesSummary = (trades: Trade[]): string => {
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  const totalFees = trades.reduce((sum, t) => sum + (t.funding_fee || 0) + (t.trading_fee || 0), 0);

  return `Trading Summary Report
Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}

Total Trades: ${trades.length}
Winning Trades: ${winningTrades}
Win Rate: ${winRate.toFixed(2)}%
Total P&L: $${totalPnl.toFixed(2)}
Total Fees: $${totalFees.toFixed(2)}
Net P&L: $${(totalPnl - totalFees).toFixed(2)}

---
`;
};

export const exportWithSummary = (trades: Trade[], filename: string = 'trades') => {
  const summary = generateTradesSummary(trades);
  const headers = [
    'Date',
    'Symbol',
    'Side',
    'Entry Price',
    'Exit Price',
    'Position Size',
    'Leverage',
    'Margin',
    'P&L',
    'ROI (%)',
    'Duration (minutes)',
    'Funding Fee',
    'Trading Fee',
    'Broker',
    'Setup',
    'Emotional Tag',
    'Period of Day',
    'Notes'
  ];

  const rows = trades.map(trade => [
    trade.trade_date ? format(new Date(trade.trade_date), 'yyyy-MM-dd HH:mm:ss') : '',
    trade.symbol || '',
    trade.side || '',
    trade.entry_price?.toString() || '',
    trade.exit_price?.toString() || '',
    trade.position_size?.toString() || '',
    trade.leverage?.toString() || '',
    trade.margin?.toString() || '',
    trade.pnl?.toString() || '',
    trade.roi?.toString() || '',
    trade.duration_minutes?.toString() || '',
    trade.funding_fee?.toString() || '',
    trade.trading_fee?.toString() || '',
    trade.broker || '',
    trade.setup || '',
    trade.emotional_tag || '',
    trade.period_of_day || '',
    trade.notes?.replace(/"/g, '""') || ''
  ]);

  const csvContent = [
    summary,
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_with_summary_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
