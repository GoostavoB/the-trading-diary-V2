import { tradeNotional } from '@/utils/tradeNotional';
let f = 0;
const ok = (n: string, c: boolean, e = '') => { if (!c) f++; console.log(`${c ? 'ok  ' : 'FALHA'} ${n}${e ? '  ' + e : ''}`); };
const t = (o: any) => tradeNotional(o);

const eth = { position_size: 40.92, entry_price: 2506.44, margin: 3418.78, leverage: 30 };
ok('ETH: usa quantidade x entrada', Math.abs(t(eth) - 102563.52) < 0.01, `$${t(eth).toFixed(2)}`);
ok('ETH: taxa de $92,17 fica realista', (92.17 / t(eth)) * 100 < 0.2, `${((92.17 / t(eth)) * 100).toFixed(3)}%`);

ok('sem quantidade, cai pra margem x alavancagem',
   t({ position_size: 0, entry_price: 0, margin: 3418.78, leverage: 30 }) === 3418.78 * 30);
ok('sem preco de entrada, tambem cai pro fallback',
   t({ position_size: 40.92, entry_price: 0, margin: 100, leverage: 10 }) === 1000);
ok('sem nada, devolve zero (nao inventa volume)',
   t({ position_size: 0, entry_price: 0, margin: 0, leverage: 0 }) === 0);
ok('alavancagem ausente conta como 1x',
   t({ position_size: 0, entry_price: 0, margin: 500, leverage: null }) === 500);
ok('strings do banco tambem funcionam',
   Math.abs(t({ position_size: '40.92', entry_price: '2506.44', margin: 0, leverage: 0 } as any) - 102563.52) < 0.01);

console.log(f === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${f} FALHA(S)`);
process.exit(f === 0 ? 0 : 1);
