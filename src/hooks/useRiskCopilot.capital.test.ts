/**
 * O capital de risco tem que se mover com TUDO: aporte, retirada, ganho e perda.
 * Espelha a conta do useRiskCopilot (aportes + resultado realizado).
 */
import { calculateTradePnL } from '@/utils/pnl';

let f = 0;
const ok = (n: string, c: boolean, e = '') => { if (!c) f++; console.log(`${c ? 'ok  ' : 'FALHA'} ${n}${e ? '  ' + e : ''}`); };
const usd = (n: number) => `$${n.toFixed(2)}`;

const capital = (aportes: number[], trades: any[]) =>
  Math.max(0, aportes.reduce((a, b) => a + b, 0) +
    trades.reduce((s, t) => s + calculateTradePnL(t, { includeFees: true }), 0));

const stop = (cap: number, pct: number) => (cap * pct) / 100;

const ganho = { profit_loss: 209, trading_fee: 0, funding_fee: 0 };
const perda = { profit_loss: -150, trading_fee: 0, funding_fee: 0 };

ok('só aporte', capital([3000], []) === 3000, usd(capital([3000], [])));
ok('aporte + ganho', capital([3000], [ganho]) === 3209, usd(capital([3000], [ganho])));
ok('aporte + perda', capital([3000], [perda]) === 2850, usd(capital([3000], [perda])));
ok('ganho e perda juntos', capital([3000], [ganho, perda]) === 3059, usd(capital([3000], [ganho, perda])));
ok('segundo aporte soma', capital([3000, 1000], [ganho]) === 4209, usd(capital([3000, 1000], [ganho])));
ok('RETIRADA subtrai', capital([3000, -500], [ganho]) === 2709, usd(capital([3000, -500], [ganho])));
ok('retirada + perda', capital([3000, -500], [perda]) === 2350, usd(capital([3000, -500], [perda])));
ok('nunca fica negativo', capital([1000, -900], [perda]) === 0, usd(capital([1000, -900], [perda])));

console.log('\n  o stop acompanha:');
for (const [nome, cap] of [['só aporte', 3000], ['depois de ganhar', 3209], ['depois de perder', 2850], ['depois de sacar 500', 2709]] as [string, number][]) {
  console.log(`    ${nome.padEnd(20)} capital ${usd(cap).padStart(9)}  ->  Long Shot 20% = ${usd(stop(cap, 20)).padStart(8)}   Scalp 2% = ${usd(stop(cap, 2))}`);
}
ok('stop sobe quando o capital sobe', stop(3209, 20) > stop(3000, 20));
ok('stop cai quando o capital cai', stop(2850, 20) < stop(3000, 20));
ok('stop cai depois de uma retirada', stop(2709, 20) < stop(3209, 20));

console.log(f === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${f} FALHA(S)`);
process.exit(f === 0 ? 0 : 1);
