/**
 * A convenção de profit_loss precisa ser UMA. Os dois utilitários já
 * discordaram — pnl.ts tratava como bruto, feeCalculations como líquido — e um
 * trade lançado pela convenção errada teve a taxa descontada duas vezes.
 */
import { calculateTradePnL } from '@/utils/pnl';
import { calculateEnhancedMetrics } from '@/utils/feeCalculations';

let f = 0;
const ok = (n: string, c: boolean, e = '') => { if (!c) f++; console.log(`${c ? 'ok  ' : 'FALHA'} ${n}${e ? '  ' + e : ''}`); };
const usd = (n: number) => `$${n.toFixed(2)}`;

// O trade real de BTC: bruto 329,88, taxas 48,2251, líquido 281,65
const btc: any = {
  profit_loss: 329.88, trading_fee: 48.2251, funding_fee: 0,
  position_size: 0.6735, entry_price: 79804.7, margin: 895.81, leverage: 60,
};

const bruto = calculateTradePnL(btc, { includeFees: false });
const liquido = calculateTradePnL(btc, { includeFees: true });
ok('pnl.ts: sem taxas devolve o bruto', Math.abs(bruto - 329.88) < 0.01, usd(bruto));
ok('pnl.ts: com taxas devolve o líquido', Math.abs(liquido - 281.65) < 0.01, usd(liquido));

const m = calculateEnhancedMetrics(btc);
ok('feeCalculations concorda no bruto', Math.abs(m.grossPnL - bruto) < 0.01, usd(m.grossPnL));
ok('feeCalculations concorda no líquido', Math.abs(m.netPnL - liquido) < 0.01, usd(m.netPnL));
ok('os dois utilitários dão o MESMO líquido', Math.abs(m.netPnL - liquido) < 0.01);
ok('bruto − líquido = as taxas', Math.abs((m.grossPnL - m.netPnL) - 48.2251) < 0.01);

// Somar três trades não pode descontar taxa duas vezes
const eth: any = { profit_loss: 301.17, trading_fee: 92.17, funding_fee: 0, position_size: 40.92, entry_price: 2506.44, margin: 3418.78, leverage: 30 };
const ondo: any = { profit_loss: 332.35, trading_fee: 40.05, funding_fee: 0, margin: 3145, leverage: 20 };
const total = [btc, eth, ondo].reduce((s, t) => s + calculateTradePnL(t, { includeFees: true }), 0);
ok('meta mensal soma o líquido correto', Math.abs(total - 782.95) < 0.05, usd(total));
ok('e NÃO o valor com taxa dobrada', Math.abs(total - 642.55) > 100);

console.log(f === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${f} FALHA(S)`);
process.exit(f === 0 ? 0 : 1);
