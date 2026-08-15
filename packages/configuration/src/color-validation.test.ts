import { describe, expect, it } from "vitest";
import { isValidHexColor } from "./color-validation";

describe("isValidHexColor", () => {
  it("acepta hex de 6 digitos", () => {
    expect(isValidHexColor("#0B3C5D")).toBe(true);
  });

  it("acepta hex de 3 digitos", () => {
    expect(isValidHexColor("#fff")).toBe(true);
  });

  it("rechaza valores sin # inicial", () => {
    expect(isValidHexColor("0B3C5D")).toBe(false);
  });

  it("rechaza intentos de inyeccion en el valor de color", () => {
    expect(isValidHexColor("red; } body { display:none } /*")).toBe(false);
  });
});
