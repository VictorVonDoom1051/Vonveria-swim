import { describe, expect, it } from "vitest";
import { buildChargeSummary } from "./charge-summary";

const base = {
  annualFeeAmount: "800",
  enrollmentFeeAmount: "300",
  chargesEnrollmentFee: true,
  billingModality: "MONTHLY",
  monthlyRateAmount: "1500",
};

describe("buildChargeSummary", () => {
  it("suma anualidad, inscripcion y primera mensualidad", () => {
    const summary = buildChargeSummary(base);

    expect(summary.lines.map((line) => line.concept)).toEqual([
      "Anualidad",
      "Inscripción",
      "Primera mensualidad",
    ]);
    expect(summary.total).toBe(2600);
  });

  it("omite la inscripcion cuando el alumno ya la pago", () => {
    const summary = buildChargeSummary({ ...base, chargesEnrollmentFee: false });

    expect(summary.lines.map((line) => line.concept)).toEqual(["Anualidad", "Primera mensualidad"]);
    expect(summary.total).toBe(2300);
  });

  it("sin cobro recurrente solo cobra anualidad e inscripcion", () => {
    const summary = buildChargeSummary({ ...base, billingModality: "NONE" });

    expect(summary.total).toBe(1100);
  });

  it("ignora montos vacios o invalidos en lugar de sumar NaN", () => {
    const summary = buildChargeSummary({
      ...base,
      enrollmentFeeAmount: "",
      monthlyRateAmount: "abc",
    });

    expect(summary.lines.map((line) => line.concept)).toEqual(["Anualidad"]);
    expect(summary.total).toBe(800);
  });
});
