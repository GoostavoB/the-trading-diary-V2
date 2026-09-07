import type { Trade } from '@/types/trade';

/**
 * Valor nocional de um trade, em dólares.
 *
 * `position_size` é a QUANTIDADE do ativo, não um valor em dólares — o próprio
 * app confirma isso ao derivar a margem como `(position_size × entry_price) /
 * leverage`. Somar `position_size` direto num total de volume mistura unidades:
 * 40,92 ETH viram "$40,92", e a taxa de $92,17 sobre isso aparece como 225%,
 * marcada como "Abusive", quando a taxa real é 0,090%.
 *
 * A ordem das tentativas importa:
 *   1. quantidade × preço de entrada — o mais exato;
 *   2. margem × alavancagem — quando não há quantidade ou preço;
 *   3. zero — sem dados suficientes, melhor não inventar volume.
 */
export function tradeNotional(trade: Pick<Trade, 'position_size' | 'entry_price' | 'margin' | 'leverage'>): number {
  const qty = Number(trade.position_size) || 0;
  const entry = Number(trade.entry_price) || 0;
  if (qty > 0 && entry > 0) return qty * entry;

  const margin = Number(trade.margin) || 0;
  const leverage = Number(trade.leverage) || 1;
  if (margin > 0) return margin * leverage;

  return 0;
}
