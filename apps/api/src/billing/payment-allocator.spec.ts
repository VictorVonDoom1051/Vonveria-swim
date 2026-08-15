import { describe, expect, it } from "vitest";
import { Prisma } from "@vonveria-swim/database";
import { allocatePayment } from "./payment-allocator";

function decimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

describe("allocatePayment", () => {
  it("asigna el pago exacto a un solo cargo, sin sobrante", () => {
    const { allocations, remainder } = allocatePayment(decimal(300), [
      { chargeId: "c1", balance: decimal(300) },
    ]);
    expect(allocations).toEqual([{ chargeId: "c1", amount: decimal(300) }]);
    expect(remainder.toNumber()).toBe(0);
  });

  it("asigna parcialmente al cargo mas antiguo cuando el pago no alcanza", () => {
    const { allocations, remainder } = allocatePayment(decimal(150), [
      { chargeId: "c1", balance: decimal(300) },
      { chargeId: "c2", balance: decimal(200) },
    ]);
    expect(allocations).toEqual([{ chargeId: "c1", amount: decimal(150) }]);
    expect(remainder.toNumber()).toBe(0);
  });

  it("reparte entre varios cargos en orden hasta agotar el monto", () => {
    const { allocations, remainder } = allocatePayment(decimal(250), [
      { chargeId: "c1", balance: decimal(100) },
      { chargeId: "c2", balance: decimal(100) },
      { chargeId: "c3", balance: decimal(100) },
    ]);
    expect(allocations).toEqual([
      { chargeId: "c1", amount: decimal(100) },
      { chargeId: "c2", amount: decimal(100) },
      { chargeId: "c3", amount: decimal(50) },
    ]);
    expect(remainder.toNumber()).toBe(0);
  });

  it("deja sobrante como saldo a favor cuando el pago excede lo debido", () => {
    const { allocations, remainder } = allocatePayment(decimal(500), [
      { chargeId: "c1", balance: decimal(300) },
    ]);
    expect(allocations).toEqual([{ chargeId: "c1", amount: decimal(300) }]);
    expect(remainder.toNumber()).toBe(200);
  });

  it("no asigna nada si no hay cargos abiertos", () => {
    const { allocations, remainder } = allocatePayment(decimal(100), []);
    expect(allocations).toEqual([]);
    expect(remainder.toNumber()).toBe(100);
  });
});
