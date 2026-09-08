import { describe, it, expect } from 'vitest';
import { calcularBalanceamento, TRAVA_STOP_PADRAO } from './surplusEngine';

describe('calcularBalanceamento', () => {
  it('reproduz o exemplo do blueprint', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [3, 6, 10] });
    expect(r.maiorRiscoPct).toBe(10);
    expect(r.riscoMaximo).toBeCloseTo(100, 2);
    expect(r.contaDeTrade).toBeCloseTo(142.86, 2);
    expect(r.fundoProtegido).toBeCloseTo(857.14, 2);
  });

  it('fecha a prova real: conta de trade x trava = risco autorizado', () => {
    for (const capital of [500, 1000, 3783, 91234.56]) {
      for (const pct of [1, 5, 8, 15, 20]) {
        const r = calcularBalanceamento({ capitalTotal: capital, perfisPct: [pct] });
        expect(r.contaDeTrade * TRAVA_STOP_PADRAO).toBeCloseTo(capital * (pct / 100), 6);
      }
    }
  });

  it('as duas contas sempre somam o capital total', () => {
    const r = calcularBalanceamento({ capitalTotal: 3783, perfisPct: [5, 8, 15, 20] });
    expect(r.contaDeTrade + r.fundoProtegido).toBeCloseTo(3783, 6);
  });

  it('usa o perfil mais agressivo, nao a media nem o primeiro da lista', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [20, 5, 8] });
    expect(r.maiorRiscoPct).toBe(20);
  });

  it('sem perfil configurado nao inventa percentual: tudo fica protegido', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [] });
    expect(r.maiorRiscoPct).toBe(0);
    expect(r.contaDeTrade).toBe(0);
    expect(r.fundoProtegido).toBe(1000);
  });

  it('ignora percentuais zerados ou negativos', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [0, -5, 3] });
    expect(r.maiorRiscoPct).toBe(3);
  });

  it('aponta transferencia quando a conta de trade tem excesso', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [10], saldoTradeAtual: 1000 });
    expect(r.precisaTransferir).toBe(true);
    expect(r.excedente).toBeCloseTo(857.14, 2);
  });

  it('nao pede transferencia quando o saldo ja esta no ponto', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [10], saldoTradeAtual: 142.86 });
    expect(r.precisaTransferir).toBe(false);
  });

  it('nao pede transferencia quando a conta de trade tem MENOS que o limite', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [10], saldoTradeAtual: 50 });
    expect(r.precisaTransferir).toBe(false);
    expect(r.excedente).toBe(0);
  });

  it('perda numa liquidacao total e a conta inteira, maior que o risco autorizado', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [10] });
    expect(r.perdaEmLiquidacaoTotal).toBeCloseTo(142.86, 2);
    expect(r.perdaEmLiquidacaoTotal).toBeGreaterThan(r.riscoMaximo);
  });

  it('capital zero nao gera NaN nem negativo', () => {
    const r = calcularBalanceamento({ capitalTotal: 0, perfisPct: [20] });
    expect(r.contaDeTrade).toBe(0);
    expect(r.fundoProtegido).toBe(0);
    expect(Number.isFinite(r.contaDeTrade)).toBe(true);
  });

  it('trava customizada muda o dimensionamento', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [10], travaStop: 0.5 });
    expect(r.contaDeTrade).toBeCloseTo(200, 2);
    expect(r.fundoProtegido).toBeCloseTo(800, 2);
  });

  it('perfil de 100% deixa tudo na conta de trade e nada protegido', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [70], travaStop: 0.7 });
    expect(r.contaDeTrade).toBeCloseTo(1000, 2);
    expect(r.fundoProtegido).toBeCloseTo(0, 2);
  });

  it('perfil acima da trava nao gera fundo negativo', () => {
    const r = calcularBalanceamento({ capitalTotal: 1000, perfisPct: [90], travaStop: 0.7 });
    expect(r.fundoProtegido).toBe(0);
  });

  it('numeros reais do Gustavo hoje', () => {
    const r = calcularBalanceamento({ capitalTotal: 3783, perfisPct: [5, 8, 15, 20] });
    expect(r.contaDeTrade).toBeCloseTo(1080.86, 2);
    expect(r.fundoProtegido).toBeCloseTo(2702.14, 2);
  });
});
