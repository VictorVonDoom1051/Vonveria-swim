import { Prisma } from "@vonveria-swim/database";

export interface AllocatableCharge {
  chargeId: string;
  balance: Prisma.Decimal;
}

export interface AllocationResult {
  chargeId: string;
  amount: Prisma.Decimal;
}

export interface AllocatePaymentResult {
  allocations: AllocationResult[];
  /** Lo que sobra si el pago excede lo debido (Seccion 12: pagos excedentes). No se pierde, solo no se asigna. */
  remainder: Prisma.Decimal;
}

/**
 * Reparte un pago entre cargos abiertos en el orden que ya viene ordenado
 * `openCharges` (tipicamente por vencimiento, el mas antiguo primero),
 * hasta agotar el monto del pago o los cargos.
 */
export function allocatePayment(
  paymentAmount: Prisma.Decimal,
  openCharges: readonly AllocatableCharge[],
): AllocatePaymentResult {
  let remaining = paymentAmount;
  const allocations: AllocationResult[] = [];

  for (const charge of openCharges) {
    if (remaining.lessThanOrEqualTo(0)) {
      break;
    }
    const amountToAllocate = Prisma.Decimal.min(remaining, charge.balance);
    if (amountToAllocate.greaterThan(0)) {
      allocations.push({ chargeId: charge.chargeId, amount: amountToAllocate });
      remaining = remaining.minus(amountToAllocate);
    }
  }

  return { allocations, remainder: remaining };
}
