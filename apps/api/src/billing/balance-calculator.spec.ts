import { describe, expect, it } from "vitest";
import { Prisma } from "@vonveria-swim/database";
import { calculateChargeBalance } from "./balance-calculator";

function decimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

describe("calculateChargeBalance", () => {
  it("es igual al monto cuando no hay ajustes ni asignaciones", () => {
    const balance = calculateChargeBalance({
      amount: decimal(500),
      adjustmentAmounts: [],
      allocatedAmounts: [],
    });
    expect(balance.toNumber()).toBe(500);
  });

  it("resta las asignaciones de pagos", () => {
    const balance = calculateChargeBalance({
      amount: decimal(500),
      adjustmentAmounts: [],
      allocatedAmounts: [decimal(200), decimal(100)],
    });
    expect(balance.toNumber()).toBe(200);
  });

  it("suma ajustes positivos y resta descuentos negativos", () => {
    const balance = calculateChargeBalance({
      amount: decimal(500),
      adjustmentAmounts: [decimal(-50), decimal(20)],
      allocatedAmounts: [decimal(100)],
    });
    expect(balance.toNumber()).toBe(370);
  });

  it("llega a cero cuando el pago cubre el total exacto", () => {
    const balance = calculateChargeBalance({
      amount: decimal(300),
      adjustmentAmounts: [],
      allocatedAmounts: [decimal(300)],
    });
    expect(balance.toNumber()).toBe(0);
  });
});
