import { describe, expect, it } from "vitest";
import { calculateStockOnHand } from "./stock-calculator";

describe("calculateStockOnHand", () => {
  it("suma entradas y salidas", () => {
    expect(calculateStockOnHand([20, -3, -2])).toBe(15);
  });

  it("un producto sin movimientos no tiene existencias", () => {
    expect(calculateStockOnHand([])).toBe(0);
  });

  it("refleja el negativo en vez de esconderlo, para que el ajuste sea visible", () => {
    expect(calculateStockOnHand([5, -8])).toBe(-3);
  });
});
