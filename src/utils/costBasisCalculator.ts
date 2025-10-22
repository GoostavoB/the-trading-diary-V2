/**
 * Cost Basis Calculator
 * Handles FIFO and Average cost methods for position tracking
 */

export interface PositionLot {
  id: string;
  quantity_remaining: number;
  cost_basis_per_unit: number;
  acquisition_date: string;
  acquisition_tx_id?: string;
  lot_method: 'FIFO' | 'Average';
  is_closed: boolean;
}

export interface RealizedPnL {
  proceeds_base: number;
  cost_disposed_base: number;
  fees_base: number;
  realized_pnl: number;
  lots_used: PositionLot[];
}

/**
 * Calculate FIFO (First In, First Out) realized P&L
 */
export function calculateFIFO(
  lots: PositionLot[],
  sellQuantity: number,
  sellPrice: number,
  fees: number = 0
): RealizedPnL {
  // Sort lots by acquisition date (oldest first)
  const sortedLots = [...lots]
    .filter(lot => !lot.is_closed && lot.quantity_remaining > 0)
    .sort((a, b) => new Date(a.acquisition_date).getTime() - new Date(b.acquisition_date).getTime());

  let remainingToSell = sellQuantity;
  let totalCostBasis = 0;
  const lotsUsed: PositionLot[] = [];

  for (const lot of sortedLots) {
    if (remainingToSell <= 0) break;

    const quantityFromThisLot = Math.min(remainingToSell, lot.quantity_remaining);
    const costFromThisLot = quantityFromThisLot * lot.cost_basis_per_unit;

    totalCostBasis += costFromThisLot;
    remainingToSell -= quantityFromThisLot;

    lotsUsed.push({
      ...lot,
      quantity_remaining: quantityFromThisLot,
    });
  }

  const proceeds = sellQuantity * sellPrice;
  const realizedPnL = proceeds - totalCostBasis - fees;

  return {
    proceeds_base: proceeds,
    cost_disposed_base: totalCostBasis,
    fees_base: fees,
    realized_pnl: realizedPnL,
    lots_used: lotsUsed,
  };
}

/**
 * Calculate Average cost for a position
 */
export function calculateAverageCost(
  currentQuantity: number,
  currentTotalCost: number,
  newQuantity: number,
  newCost: number
): number {
  const totalQuantity = currentQuantity + newQuantity;
  const totalCost = currentTotalCost + newCost;
  
  if (totalQuantity === 0) return 0;
  
  return totalCost / totalQuantity;
}

/**
 * Calculate realized P&L for Average cost method
 */
export function calculateAveragePnL(
  averageCost: number,
  sellQuantity: number,
  sellPrice: number,
  fees: number = 0
): RealizedPnL {
  const costBasis = averageCost * sellQuantity;
  const proceeds = sellQuantity * sellPrice;
  const realizedPnL = proceeds - costBasis - fees;

  return {
    proceeds_base: proceeds,
    cost_disposed_base: costBasis,
    fees_base: fees,
    realized_pnl: realizedPnL,
    lots_used: [],
  };
}

/**
 * Calculate unrealized P&L
 */
export function calculateUnrealizedPnL(
  quantity: number,
  costBasis: number,
  currentPrice: number
): { unrealized_pnl: number; unrealized_roi: number } {
  const currentValue = quantity * currentPrice;
  const unrealizedPnL = currentValue - costBasis;
  const unrealizedROI = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

  return {
    unrealized_pnl: unrealizedPnL,
    unrealized_roi: unrealizedROI,
  };
}

/**
 * Update position lots after a transaction
 */
export function updateLotsAfterTransaction(
  existingLots: PositionLot[],
  transactionType: 'buy' | 'sell',
  quantity: number,
  price: number,
  method: 'FIFO' | 'Average',
  transactionId: string,
  transactionDate: string
): PositionLot[] {
  if (transactionType === 'buy') {
    // Add new lot
    const newLot: PositionLot = {
      id: `${transactionId}-${Date.now()}`,
      quantity_remaining: quantity,
      cost_basis_per_unit: price,
      acquisition_date: transactionDate,
      acquisition_tx_id: transactionId,
      lot_method: method,
      is_closed: false,
    };
    return [...existingLots, newLot];
  } else {
    // Sell - reduce lots based on method
    if (method === 'FIFO') {
      const updatedLots = [...existingLots];
      let remainingToSell = quantity;

      for (let i = 0; i < updatedLots.length && remainingToSell > 0; i++) {
        const lot = updatedLots[i];
        if (lot.is_closed || lot.quantity_remaining <= 0) continue;

        const quantityToReduce = Math.min(remainingToSell, lot.quantity_remaining);
        lot.quantity_remaining -= quantityToReduce;
        remainingToSell -= quantityToReduce;

        if (lot.quantity_remaining === 0) {
          lot.is_closed = true;
        }
      }

      return updatedLots;
    } else {
      // Average - reduce all lots proportionally
      const totalQuantity = existingLots.reduce((sum, lot) => sum + lot.quantity_remaining, 0);
      const remainingQuantity = totalQuantity - quantity;

      return existingLots.map(lot => ({
        ...lot,
        quantity_remaining: lot.quantity_remaining * (remainingQuantity / totalQuantity),
        is_closed: remainingQuantity === 0,
      }));
    }
  }
}
