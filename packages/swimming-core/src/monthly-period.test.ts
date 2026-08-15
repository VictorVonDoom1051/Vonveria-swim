import { describe, expect, it } from "vitest";
import { resolveMonthlyChargePeriod } from "./index";

describe("resolveMonthlyChargePeriod", () => {
  it("usa el dia de vencimiento tal cual cuando existe en el mes", () => {
    const period = resolveMonthlyChargePeriod(new Date(Date.UTC(2026, 8, 5)), 10);
    expect(period).toEqual({
      periodYear: 2026,
      periodMonth: 9,
      dueDate: new Date(Date.UTC(2026, 8, 10)),
    });
  });

  it("ajusta el dia de vencimiento a los dias reales del mes (febrero no bisiesto)", () => {
    const period = resolveMonthlyChargePeriod(new Date(Date.UTC(2027, 1, 1)), 31);
    expect(period.periodMonth).toBe(2);
    expect(period.dueDate).toEqual(new Date(Date.UTC(2027, 1, 28)));
  });

  it("ajusta el dia de vencimiento en febrero bisiesto", () => {
    const period = resolveMonthlyChargePeriod(new Date(Date.UTC(2028, 1, 1)), 31);
    expect(period.dueDate).toEqual(new Date(Date.UTC(2028, 1, 29)));
  });
});
