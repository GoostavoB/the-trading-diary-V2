/**
 * Motor de rolagem de surplus e trava de risco.
 *
 * Agnóstico a prazo, moeda e percentual: recebe o saldo do ciclo encerrado, a
 * meta, quanto o usuário autoriza arriscar e a trava de stop da corretora, e
 * devolve como o capital deve ficar dividido no ciclo seguinte.
 *
 * A conta central é:
 *
 *     Saldo na conta de trade = Risco autorizado / Trava de stop
 *
 * Se a trava é 70%, autorizar $2.500 de risco significa manter $3.571,43 na
 * conta de trade — porque um stop que consome 70% dessa banca perde exatamente
 * os $2.500 autorizados.
 *
 * ATENÇÃO A DUAS COISAS QUE A FÓRMULA NÃO DIZ SOZINHA:
 *
 * 1. A alocação conserva o capital: cofre = saldo − conta de trade. Uma versão
 *    anterior desta especificação mandava o cofre receber "surplus − buffer +
 *    meta" enquanto a conta recebia "buffer / 0,70"; as duas somadas davam mais
 *    dinheiro do que existia. Aqui o cofre é sempre o resto.
 *
 * 2. Com rollover alto, parte da META vai para a conta de trade. Autorizando
 *    100% de um surplus de $2.500, a conta precisa de $3.571,43 — mais do que o
 *    surplus inteiro. O cofre fica abaixo da meta, e isso é esperado: o capital
 *    volta ao nível da meta desde que a perda fique no risco autorizado. Não é
 *    bug, mas o usuário precisa ver, senão acha que sumiu dinheiro.
 */

export interface EntradaCiclo {
  /** Saldo apurado no encerramento do ciclo. */
  saldoAtual: number;
  /** Meta do ciclo que acabou. */
  meta: number;
  /** Quanto do surplus o usuário autoriza arriscar no ciclo seguinte. */
  riscoAutorizado: number;
  /** Trava de stop da corretora, como fração. 0.70 = 70%. */
  travaStop: number;
}

export interface ResultadoCiclo {
  surplus: number;
  riscoAutorizado: number;
  /** Quanto fica na conta operacional. */
  saldoTrade: number;
  /** Quanto fica isolado, fora de risco. */
  saldoCofre: number;
  /** Perda se o stop for respeitado — é o risco autorizado. */
  perdaPlanejada: number;
  /**
   * Perda se a conta de trade for liquidada inteira. Maior que a planejada,
   * porque a conta guarda mais do que o risco autorizado para que o stop de
   * `travaStop` corresponda exatamente a ele.
   */
  perdaEmLiquidacaoTotal: number;
  /** O cofre ficou abaixo da meta? Acontece com rollover alto. */
  cofreAbaixoDaMeta: boolean;
  /** De quanto é essa diferença. Zero quando o cofre cobre a meta. */
  faltaNoCofre: number;
}

export const TRAVA_STOP_PADRAO = 0.7;

/** Surplus do ciclo. Nunca negativo — ciclo no prejuízo não gera rolagem. */
export function calcularSurplus(saldoAtual: number, meta: number): number {
  return Math.max(0, (saldoAtual || 0) - (meta || 0));
}

export function calcularCiclo(e: EntradaCiclo): ResultadoCiclo {
  const surplus = calcularSurplus(e.saldoAtual, e.meta);

  // A trava precisa ser uma fração usável. Fora de (0,1] a divisão explode ou
  // inverte o sentido, então cai no padrão em vez de produzir número absurdo.
  const trava = e.travaStop > 0 && e.travaStop <= 1 ? e.travaStop : TRAVA_STOP_PADRAO;

  // Não se arrisca mais do que o surplus, nem valor negativo.
  const risco = Math.min(Math.max(e.riscoAutorizado || 0, 0), surplus);

  const saldoTrade = risco / trava;
  const saldoCofre = (e.saldoAtual || 0) - saldoTrade;
  const faltaNoCofre = Math.max(0, (e.meta || 0) - saldoCofre);

  return {
    surplus,
    riscoAutorizado: risco,
    saldoTrade,
    saldoCofre,
    perdaPlanejada: risco,
    perdaEmLiquidacaoTotal: saldoTrade,
    cofreAbaixoDaMeta: faltaNoCofre > 0.005,
    faltaNoCofre,
  };
}

/** Atalhos do slider. */
export const PRESETS_ROLAGEM = [0, 25, 50, 75, 100] as const;

export function riscoDoPercentual(surplus: number, pct: number): number {
  return (surplus * pct) / 100;
}

export function percentualDoRisco(surplus: number, risco: number): number {
  if (surplus <= 0) return 0;
  return Math.min(100, Math.max(0, (risco / surplus) * 100));
}

/* ══════════════════════════════════════════════════════════════════════════
   BALANCEAMENTO DE CONTAS — quanto deixar exposto na corretora

   Mesma relação `risco ÷ trava` da rolagem de surplus, aplicada a outra
   pergunta: dado o capital total e o perfil de risco mais agressivo que o
   usuário configurou, quanto precisa ficar na conta de trade para que uma
   liquidação a 70% custe exatamente o risco autorizado — e quanto sobra para
   ficar fora de alcance.
   ══════════════════════════════════════════════════════════════════════════ */

export interface EntradaBalanceamento {
  /** Capital consolidado: conta de trade + fundo protegido. */
  capitalTotal: number;
  /** Percentuais de risco dos perfis ativos, ex.: [5, 8, 15, 20]. */
  perfisPct: number[];
  /** Trava de stop da corretora, como fração. */
  travaStop?: number;
  /** Saldo que está hoje na conta de trade, se conhecido. */
  saldoTradeAtual?: number;
}

export interface ResultadoBalanceamento {
  /** O perfil mais agressivo, que dita o dimensionamento. */
  maiorRiscoPct: number;
  /** Risco em dólares desse perfil sobre o capital total. */
  riscoMaximo: number;
  /** Quanto manter na conta de trade. */
  contaDeTrade: number;
  /** Quanto blindar fora dela. */
  fundoProtegido: number;
  /** Há excesso na conta de trade a transferir? */
  precisaTransferir: boolean;
  excedente: number;
  /**
   * Perda numa liquidação total da conta de trade. Maior que o risco
   * autorizado, porque a conta guarda mais do que ele — é o preço de a trava
   * ser uma regra de dimensionamento e não um limite da corretora.
   */
  perdaEmLiquidacaoTotal: number;
}

export function calcularBalanceamento(e: EntradaBalanceamento): ResultadoBalanceamento {
  const trava = e.travaStop && e.travaStop > 0 && e.travaStop <= 1 ? e.travaStop : TRAVA_STOP_PADRAO;
  const capital = Math.max(0, e.capitalTotal || 0);

  // Sem perfil configurado não há o que dimensionar: devolve tudo protegido em
  // vez de assumir um percentual qualquer.
  const validos = (e.perfisPct || []).filter((p) => p > 0);
  const maiorRiscoPct = validos.length ? Math.max(...validos) : 0;

  const riscoMaximo = capital * (maiorRiscoPct / 100);
  const contaDeTrade = riscoMaximo / trava;
  const fundoProtegido = Math.max(0, capital - contaDeTrade);

  const saldoHoje = e.saldoTradeAtual ?? contaDeTrade;
  const excedente = Math.max(0, saldoHoje - contaDeTrade);

  return {
    maiorRiscoPct,
    riscoMaximo,
    contaDeTrade,
    fundoProtegido,
    precisaTransferir: excedente > 0.005,
    excedente,
    perdaEmLiquidacaoTotal: contaDeTrade,
  };
}
