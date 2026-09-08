import type { Trade } from '@/types/trade';
import { calculateTradePnL } from '@/utils/pnl';

/**
 * Leituras de risco derivadas APENAS de dados reais do usuário.
 *
 * Substitui o cálculo anterior da página de Risk Management, que era código de
 * rascunho publicado: `dailyRisk = avgLoss * 0.5`, `weeklyRisk = dailyRisk * 3`,
 * `openPositionsRisk = 250` (constante fixa) e uma banca fixa de $10.000. O
 * comentário no arquivo dizia "Simulated calculations (in production, these
 * would be more sophisticated)".
 *
 * A regra aqui é simples: se o dado não existe, a função devolve `null` e a
 * tela diz que não sabe. Nenhum número é estimado por multiplicador inventado.
 */

export interface DisciplinaStop {
  /** Trades que registraram stop planejado e podem ser avaliados. */
  avaliados: number;
  /** Quantos foram encerrados numa perda MAIOR que o stop planejado. */
  estourados: number;
  /** Pior estouro observado, em % além do stop. */
  piorEstouroPct: number | null;
}

export interface RiscoPorSetup {
  setup: string;
  trades: number;
  acerto: number;
  /** Razão entre ganho médio e perda média, ambos líquidos. */
  rr: number | null;
  alavancagemMedia: number | null;
  /** Resultado líquido acumulado. */
  liquido: number;
}

export interface CurvaCapital {
  data: string;
  capital: number;
  pico: number;
  quedaPct: number;
}

/** Perda máxima real já realizada num único trade. */
export function piorPerda(trades: Trade[]): number | null {
  const perdas = trades
    .map((t) => calculateTradePnL(t, { includeFees: true }))
    .filter((v) => v < 0);
  return perdas.length ? Math.min(...perdas) : null;
}

/**
 * Curva de capital sobre o capital REAL, com os aportes entrando na data em
 * que aconteceram. A versão anterior partia de $10.000 fixos, então toda
 * porcentagem de drawdown estava errada por construção.
 */
export function curvaDeCapital(
  trades: Trade[],
  aportes: Array<{ log_date: string; amount_added: number }>,
): CurvaCapital[] {
  const eventos: Array<{ data: string; delta: number }> = [
    ...aportes.map((a) => ({ data: a.log_date, delta: a.amount_added || 0 })),
    ...trades
      .filter((t) => t.trade_date || t.closed_at)
      .map((t) => ({
        data: String(t.trade_date || t.closed_at).slice(0, 10),
        delta: calculateTradePnL(t, { includeFees: true }),
      })),
  ].sort((a, b) => a.data.localeCompare(b.data));

  let capital = 0;
  let pico = 0;
  const saida: CurvaCapital[] = [];
  for (const e of eventos) {
    capital += e.delta;
    if (capital > pico) pico = capital;
    saida.push({
      data: e.data,
      capital,
      pico,
      quedaPct: pico > 0 ? ((capital - pico) / pico) * 100 : 0,
    });
  }
  return saida;
}

/**
 * O stop planejado foi respeitado?
 *
 * É a métrica que os dados já permitiam e ninguém estava lendo. Compara a perda
 * realizada com a perda que o stop registrado implicava. Diz se o operador
 * segura a mão — coisa que nenhum número de "exposição estimada" mostra.
 */
export function disciplinaDeStop(trades: Trade[]): DisciplinaStop {
  let avaliados = 0;
  let estourados = 0;
  let pior: number | null = null;

  for (const t of trades) {
    const stop = Number(t.stop_loss) || 0;
    const entrada = Number(t.entry_price) || 0;
    const qtd = Number(t.position_size) || 0;
    const liquido = calculateTradePnL(t, { includeFees: true });
    if (!stop || !entrada || !qtd || liquido >= 0) continue;

    const perdaPlanejada = Math.abs(entrada - stop) * qtd;
    if (perdaPlanejada <= 0) continue;

    avaliados++;
    const perdaReal = Math.abs(liquido);
    if (perdaReal > perdaPlanejada * 1.05) {
      estourados++;
      const excesso = ((perdaReal - perdaPlanejada) / perdaPlanejada) * 100;
      if (pior === null || excesso > pior) pior = excesso;
    }
  }
  return { avaliados, estourados, piorEstouroPct: pior };
}

/** Risco e retorno agrupados por setup, para comparar o que vale a pena. */
export function riscoPorSetup(trades: Trade[], minTrades = 2): RiscoPorSetup[] {
  const grupos = new Map<string, Trade[]>();
  for (const t of trades) {
    const nome = (t.setup || '').trim() || 'Sem setup';
    if (!grupos.has(nome)) grupos.set(nome, []);
    grupos.get(nome)!.push(t);
  }

  const saida: RiscoPorSetup[] = [];
  for (const [setup, lista] of grupos) {
    if (lista.length < minTrades) continue;
    const liqs = lista.map((t) => calculateTradePnL(t, { includeFees: true }));
    const ganhos = liqs.filter((v) => v > 0);
    const perdas = liqs.filter((v) => v < 0);
    const mediaGanho = ganhos.length ? ganhos.reduce((a, b) => a + b, 0) / ganhos.length : 0;
    const mediaPerda = perdas.length ? Math.abs(perdas.reduce((a, b) => a + b, 0) / perdas.length) : 0;
    const alavs = lista.map((t) => Number(t.leverage) || 0).filter((v) => v > 0);

    saida.push({
      setup,
      trades: lista.length,
      acerto: (ganhos.length / lista.length) * 100,
      // Sem nenhuma perda ainda, o R:R não existe — devolver Infinity ou um
      // número grande daria a impressão de um setup perfeito.
      rr: mediaPerda > 0 ? mediaGanho / mediaPerda : null,
      alavancagemMedia: alavs.length ? alavs.reduce((a, b) => a + b, 0) / alavs.length : null,
      liquido: liqs.reduce((a, b) => a + b, 0),
    });
  }
  return saida.sort((a, b) => b.liquido - a.liquido);
}
