/**
 * Las existencias no son un campo editable: siempre se calculan sumando los
 * movimientos (Seccion 11 de CLAUDE.md, mismo criterio que el saldo de un
 * cargo en billing/balance-calculator.ts).
 */
export function calculateStockOnHand(deltas: readonly number[]): number {
  return deltas.reduce((total, delta) => total + delta, 0);
}
