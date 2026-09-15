import { Trade } from '@/types/trade';

export interface MonteCarloParams {
  initialCapital: number;
  tradeDays: number;
  tradesPerDay: number;
  simulations: number;
}

export interface MonteCarloResult {
  simulations: SimulationPath[];
  statistics: {
    meanFinalValue: number;
    medianFinalValue: number;
    bestCase: number;
    worstCase: number;
    probabilityOfProfit: number;
    probabilityOfRuin: number;
    maxDrawdown: number;
    valueAtRisk95: number; // 95% VaR
    valueAtRisk99: number; // 99% VaR
  };
}

export interface SimulationPath {
  id: number;
  values: number[];
  finalValue: number;
  maxDrawdown: number;
}

const normalRandom = (mean: number, stdDev: number): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
};

export const runMonteCarloSimulation = (
  trades: Trade[],
  params: MonteCarloParams
): MonteCarloResult => {
  // Calculate historical statistics
  const returns = trades
    .map(t => (t.profit_loss || 0) / (t.margin || 1))
    .filter(r => !isNaN(r) && isFinite(r));

  if (returns.length === 0) {
    throw new Error('No valid returns data for simulation');
  }

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  const totalTrades = params.tradeDays * params.tradesPerDay;
  const simulations: SimulationPath[] = [];

  // Run simulations
  for (let sim = 0; sim < params.simulations; sim++) {
    const values: number[] = [params.initialCapital];
    let currentValue = params.initialCapital;
    let peak = currentValue;
    let maxDrawdown = 0;

    for (let trade = 0; trade < totalTrades; trade++) {
      const returnPct = normalRandom(meanReturn, stdDev);
      const tradeSize = currentValue * 0.02; // 2% risk per trade
      const pnl = tradeSize * returnPct;
      
      currentValue += pnl;
      values.push(currentValue);

      // Calculate drawdown
      if (currentValue > peak) {
        peak = currentValue;
      }
      const drawdown = (peak - currentValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    simulations.push({
      id: sim,
      values,
      finalValue: currentValue,
      maxDrawdown: maxDrawdown * 100,
    });
  }

  // Calculate statistics
  const finalValues = simulations.map(s => s.finalValue).sort((a, b) => a - b);
  const meanFinalValue = finalValues.reduce((sum, v) => sum + v, 0) / finalValues.length;
  const medianFinalValue = finalValues[Math.floor(finalValues.length / 2)];
  const bestCase = finalValues[finalValues.length - 1];
  const worstCase = finalValues[0];
  
  const probabilityOfProfit = (finalValues.filter(v => v > params.initialCapital).length / params.simulations) * 100;
  const ruinThreshold = params.initialCapital * 0.5; // 50% loss
  const probabilityOfRuin = (finalValues.filter(v => v < ruinThreshold).length / params.simulations) * 100;
  
  const maxDrawdown = Math.max(...simulations.map(s => s.maxDrawdown));
  
  // Value at Risk (VaR)
  const var95Index = Math.floor(params.simulations * 0.05);
  const var99Index = Math.floor(params.simulations * 0.01);
  const valueAtRisk95 = params.initialCapital - finalValues[var95Index];
  const valueAtRisk99 = params.initialCapital - finalValues[var99Index];

  return {
    simulations,
    statistics: {
      meanFinalValue,
      medianFinalValue,
      bestCase,
      worstCase,
      probabilityOfProfit,
      probabilityOfRuin,
      maxDrawdown,
      valueAtRisk95,
      valueAtRisk99,
    },
  };
};
