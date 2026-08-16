import { describe, expect, it } from "vitest";
import { ANNUAL_PERIOD_MONTH, resolveAnnualPeriod } from "./annual-period";

const INICIO = new Date(2026, 7, 16); // 16 de agosto de 2026

describe("resolveAnnualPeriod", () => {
  it("el dia de la inscripcion corresponde al periodo de ese año", () => {
    expect(resolveAnnualPeriod(INICIO, new Date(2026, 7, 16)).periodYear).toBe(2026);
  });

  it("antes del aniversario sigue vigente el periodo anterior", () => {
    // 15 de agosto de 2027: falta un dia para cumplir el año.
    expect(resolveAnnualPeriod(INICIO, new Date(2027, 7, 15)).periodYear).toBe(2026);
  });

  it("justo el dia del aniversario arranca el periodo nuevo", () => {
    expect(resolveAnnualPeriod(INICIO, new Date(2027, 7, 16)).periodYear).toBe(2027);
  });

  it("despues del aniversario sigue en el periodo nuevo", () => {
    expect(resolveAnnualPeriod(INICIO, new Date(2027, 11, 31)).periodYear).toBe(2027);
  });

  it("dos años despues corresponde el tercer periodo", () => {
    expect(resolveAnnualPeriod(INICIO, new Date(2028, 8, 1)).periodYear).toBe(2028);
  });

  it("el vencimiento cae en el aniversario de ese periodo", () => {
    const periodo = resolveAnnualPeriod(INICIO, new Date(2027, 7, 20));
    expect(periodo.dueDate.getFullYear()).toBe(2027);
    expect(periodo.dueDate.getMonth()).toBe(7);
    expect(periodo.dueDate.getDate()).toBe(16);
  });

  it("el mes cero no puede chocar con ninguna mensualidad real", () => {
    // Los meses reales van de 1 a 12; la restriccion unica de Charge usa este
    // valor para proteger la anualidad sin depender de un NULL.
    expect(ANNUAL_PERIOD_MONTH).toBe(0);
  });
});
