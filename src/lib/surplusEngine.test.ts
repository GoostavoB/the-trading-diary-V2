import { describe, it, expect } from 'vitest';
import { calcularCiclo, calcularSurplus, riscoDoPercentual } from '@/lib/surplusEngine';

// Asserção nomeada: cada `ok` vira um teste do vitest. Antes estes arquivos
// eram scripts de linha de comando que terminavam em process.exit — passavam,
// mas o vitest os contava como falha, e a suíte inteira ficava sem sinal.
const ok = (nome: string, cond: boolean, extra = '') =>
  it(extra ? `${nome} (${extra})` : nome, () => expect(cond).toBe(true));

describe('surplusEngine', () => {
  const money = (n: number) => `$${n.toFixed(2)}`;

  // caso do Gustavo
  const S = 12500, M = 10000, P = 0.7;
  const sup = calcularSurplus(S, M);
  ok('surplus = saldo - meta', sup === 2500, money(sup));

  for (const pct of [0, 25, 50, 75, 100]) {
    const r = calcularCiclo({ saldoAtual: S, meta: M, riscoAutorizado: riscoDoPercentual(sup, pct), travaStop: P });
    const soma = r.saldoTrade + r.saldoCofre;
    ok(`${String(pct).padStart(3)}% — conserva o capital`, Math.abs(soma - S) < 1e-6,
       `conta ${money(r.saldoTrade)} + cofre ${money(r.saldoCofre)} = ${money(soma)}`);
    ok(`${String(pct).padStart(3)}% — stop de 70% da conta = risco`, Math.abs(r.saldoTrade * P - r.riscoAutorizado) < 1e-6);
    // A invariante certa e "nunca termina ABAIXO da meta". Terminar exatamente na
    // meta so acontece arriscando 100% do surplus; abaixo disso sobra mais.
    ok(`${String(pct).padStart(3)}% — nunca termina abaixo da meta`, (S - r.perdaPlanejada) >= M - 1e-6,
       `fim ${money(S - r.perdaPlanejada)} vs meta ${money(M)}`);
  }

  // o caso que assusta: 100% deixa o cofre abaixo da meta
  const cheio = calcularCiclo({ saldoAtual: S, meta: M, riscoAutorizado: sup, travaStop: P });
  ok('100% avisa que o cofre ficou abaixo da meta', cheio.cofreAbaixoDaMeta, money(cheio.faltaNoCofre));
  ok('perda em liquidacao total > perda planejada', cheio.perdaEmLiquidacaoTotal > cheio.perdaPlanejada,
     `${money(cheio.perdaEmLiquidacaoTotal)} vs ${money(cheio.perdaPlanejada)}`);

  // bordas
  ok('ciclo no prejuizo nao gera surplus', calcularSurplus(8000, 10000) === 0);
  const semSup = calcularCiclo({ saldoAtual: 8000, meta: 10000, riscoAutorizado: 500, travaStop: P });
  ok('sem surplus, nao arrisca nada', semSup.riscoAutorizado === 0 && semSup.saldoTrade === 0);
  const excesso = calcularCiclo({ saldoAtual: S, meta: M, riscoAutorizado: 99999, travaStop: P });
  ok('risco nunca passa do surplus', excesso.riscoAutorizado === sup);
  const negativo = calcularCiclo({ saldoAtual: S, meta: M, riscoAutorizado: -100, travaStop: P });
  ok('risco negativo vira zero', negativo.riscoAutorizado === 0);
  const travaZero = calcularCiclo({ saldoAtual: S, meta: M, riscoAutorizado: 1000, travaStop: 0 });
  ok('trava invalida cai no padrao 0.70', Math.abs(travaZero.saldoTrade - 1000 / 0.7) < 1e-6);
  const trava50 = calcularCiclo({ saldoAtual: S, meta: M, riscoAutorizado: 1000, travaStop: 0.5 });
  ok('trava de 50% muda a conta', Math.abs(trava50.saldoTrade - 2000) < 1e-6, money(trava50.saldoTrade));
});
