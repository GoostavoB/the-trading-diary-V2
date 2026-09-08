/**
 * O motor de risco só pode falar do que os dados provam. Estes testes travam
 * as duas coisas que a versão anterior fazia de errado: inventar número quando
 * não há dado, e calcular sobre uma banca fictícia.
 */
import { piorPerda, curvaDeCapital, disciplinaDeStop, riscoPorSetup } from '@/lib/riskInsights';

let f = 0;
const ok = (n: string, c: boolean, e = '') => { if (!c) f++; console.log(`${c ? 'ok  ' : 'FALHA'} ${n}${e ? '  ' + e : ''}`); };
const usd = (n: number) => `$${n.toFixed(2)}`;

const t = (o: any) => ({ trading_fee: 0, funding_fee: 0, ...o }) as any;

// Os três trades reais do Gustavo, em bruto (a convenção do app)
const btc  = t({ profit_loss: 329.88, trading_fee: 48.2251, setup: 'Scalp do Vitao', leverage: 60, trade_date: '2026-09-07', entry_price: 79804.7, stop_loss: 80420, position_size: 0.6735 });
const eth  = t({ profit_loss: 301.17, trading_fee: 92.17,   setup: 'Lambo',          leverage: 30, trade_date: '2026-09-06' });
const ondo = t({ profit_loss: 332.35, trading_fee: 40.05,   setup: 'Cunha',          leverage: 20, trade_date: '2026-09-05' });
const perdedor = t({ profit_loss: -150, trading_fee: 10, setup: 'Lambo', leverage: 30, trade_date: '2026-09-08' });

ok('sem perdas, piorPerda devolve null (nao zero)', piorPerda([btc, eth, ondo]) === null);
ok('com perda, devolve a maior', Math.abs(piorPerda([btc, perdedor])! - (-160)) < 0.01, usd(piorPerda([btc, perdedor])!));

// Curva sobre capital REAL, com aportes na data
const aportes = [{ log_date: '2026-09-01', amount_added: 3000 }, { log_date: '2026-09-07', amount_added: 770 }];
const curva = curvaDeCapital([btc, eth, ondo], aportes);
const fim = curva[curva.length - 1];
ok('curva parte do aporte, nao de $10.000 fixos', curva[0].capital === 3000, usd(curva[0].capital));
ok('capital final = aportes + liquido', Math.abs(fim.capital - (3770 + 782.95)) < 0.05, usd(fim.capital));
ok('sem queda, drawdown e zero', fim.quedaPct === 0);

const comQueda = curvaDeCapital([btc, perdedor], [{ log_date: '2026-09-01', amount_added: 1000 }]);
ok('drawdown medido sobre o pico real', comQueda[comQueda.length - 1].quedaPct < 0,
   comQueda[comQueda.length - 1].quedaPct.toFixed(2) + '%');

// Disciplina de stop
const d = disciplinaDeStop([btc, eth, ondo]);
ok('sem trade perdedor, nada a avaliar', d.avaliados === 0 && d.estourados === 0);
const estourou = t({ profit_loss: -900, trading_fee: 0, entry_price: 100, stop_loss: 102, position_size: 10 });
const respeitou = t({ profit_loss: -18,  trading_fee: 0, entry_price: 100, stop_loss: 102, position_size: 10 });
const d2 = disciplinaDeStop([estourou, respeitou]);
ok('detecta stop estourado', d2.avaliados === 2 && d2.estourados === 1, `${d2.estourados} de ${d2.avaliados}`);
ok('mede o tamanho do estouro', d2.piorEstouroPct !== null && d2.piorEstouroPct > 4000, d2.piorEstouroPct?.toFixed(0) + '%');

// Risco por setup
const setups = riscoPorSetup([btc, eth, ondo, perdedor], 1);
const lambo = setups.find(s => s.setup === 'Lambo')!;
ok('R:R null quando nao ha perda no setup', setups.find(s => s.setup === 'Scalp do Vitao')!.rr === null);
ok('R:R calculado quando ha perda', lambo.rr !== null && lambo.rr > 0, lambo.rr?.toFixed(2));
ok('acerto por setup', Math.abs(lambo.acerto - 50) < 0.01, lambo.acerto + '%');
ok('alavancagem media por setup', lambo.alavancagemMedia === 30);
ok('liquido por setup desconta taxa', Math.abs(lambo.liquido - (209 - 160)) < 0.01, usd(lambo.liquido));

console.log(f === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${f} FALHA(S)`);
process.exit(f === 0 ? 0 : 1);
