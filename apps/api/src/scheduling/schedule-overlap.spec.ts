import { describe, expect, it } from "vitest";
import { WeekDay } from "@vonveria-swim/database";
import { rangesOverlap } from "./schedule-overlap";

describe("rangesOverlap", () => {
  it("detecta traslape en el mismo dia con horarios que se cruzan", () => {
    const a = { weekDay: WeekDay.MONDAY, startTime: "16:00", durationMinutes: 60 };
    const b = { weekDay: WeekDay.MONDAY, startTime: "16:30", durationMinutes: 30 };

    expect(rangesOverlap(a, b)).toBe(true);
  });

  it("no hay traslape si un horario termina justo cuando empieza el otro", () => {
    const a = { weekDay: WeekDay.MONDAY, startTime: "16:00", durationMinutes: 60 };
    const b = { weekDay: WeekDay.MONDAY, startTime: "17:00", durationMinutes: 30 };

    expect(rangesOverlap(a, b)).toBe(false);
  });

  it("no hay traslape en dias distintos aunque coincida la hora", () => {
    const a = { weekDay: WeekDay.MONDAY, startTime: "16:00", durationMinutes: 60 };
    const b = { weekDay: WeekDay.TUESDAY, startTime: "16:00", durationMinutes: 60 };

    expect(rangesOverlap(a, b)).toBe(false);
  });

  it("detecta traslape cuando un rango contiene completamente al otro", () => {
    const a = { weekDay: WeekDay.FRIDAY, startTime: "09:00", durationMinutes: 120 };
    const b = { weekDay: WeekDay.FRIDAY, startTime: "09:30", durationMinutes: 15 };

    expect(rangesOverlap(a, b)).toBe(true);
  });
});
