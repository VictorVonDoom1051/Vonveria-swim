import { Prisma } from "@vonveria-swim/database";

export interface ChargeBalanceInput {
  amount: Prisma.Decimal;
  adjustmentAmounts: readonly Prisma.Decimal[];
  allocatedAmounts: readonly Prisma.Decimal[];
}

/**
 * Saldo pendiente de un cargo: monto original + ajustes - lo ya asignado
 * por pagos. Nunca es un campo editable (Seccion 11 de CLAUDE.md); siempre
 * se recalcula desde los movimientos.
 */
export function calculateChargeBalance(input: ChargeBalanceInput): Prisma.Decimal {
  const adjustmentsTotal = input.adjustmentAmounts.reduce(
    (sum, amount) => sum.plus(amount),
    new Prisma.Decimal(0),
  );
  const allocatedTotal = input.allocatedAmounts.reduce(
    (sum, amount) => sum.plus(amount),
    new Prisma.Decimal(0),
  );
  return input.amount.plus(adjustmentsTotal).minus(allocatedTotal);
}
