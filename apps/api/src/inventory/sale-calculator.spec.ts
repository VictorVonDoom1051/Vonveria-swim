import { describe, expect, it } from "vitest";
import { calculateLineTotal, calculateSaleTotal } from "./sale-calculator";

describe("sale-calculator", () => {
  it("multiplica precio por cantidad sin perder centavos", () => {
    expect(calculateLineTotal({ quantity: 3, unitPrice: "89.90" }).toString()).toBe("269.7");
  });

  it("suma varios renglones", () => {
    const total = calculateSaleTotal([
      { quantity: 1, unitPrice: "150.00" },
      { quantity: 2, unitPrice: "25.50" },
      { quantity: 4, unitPrice: "12.00" },
    ]);
    expect(total.toString()).toBe("249");
  });

  it("una venta sin renglones vale cero", () => {
    expect(calculateSaleTotal([]).toString()).toBe("0");
  });

  it("usa el precio que se le pasa, no uno global: el renglon congela el precio de venta", () => {
    const alMomentoDeVender = calculateLineTotal({ quantity: 2, unitPrice: "100.00" });
    const precioNuevoDelProducto = calculateLineTotal({ quantity: 2, unitPrice: "180.00" });
    expect(alMomentoDeVender.toString()).toBe("200");
    expect(precioNuevoDelProducto.toString()).toBe("360");
  });
});
