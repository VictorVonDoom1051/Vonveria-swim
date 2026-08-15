import { Prisma } from "@vonveria-swim/database";

export interface SaleLineAmounts {
  quantity: number;
  /** Precio congelado al momento de vender, no el precio actual del producto. */
  unitPrice: Prisma.Decimal | string;
}

/** Decimal y nunca float, porque es dinero (Seccion 11). */
export function calculateLineTotal(line: SaleLineAmounts): Prisma.Decimal {
  return new Prisma.Decimal(line.unitPrice).times(line.quantity);
}

export function calculateSaleTotal(lines: readonly SaleLineAmounts[]): Prisma.Decimal {
  return lines.reduce((total, line) => total.plus(calculateLineTotal(line)), new Prisma.Decimal(0));
}
