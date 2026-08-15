import { describe, expect, it } from "vitest";
import { WeekDay } from "@vonveria-swim/database";
import { generateSessions } from "./session-generation";

describe("generateSessions", () => {
  it("genera una sesion por cada ocurrencia del dia de la semana dentro del horizonte", () => {
    // 2026-08-10 es lunes.
    const from = new Date("2026-08-10T00:00:00");
    const rules = [{ weekDay: WeekDay.MONDAY, startTime: "16:00", durationMinutes: 45 }];

    const sessions = generateSessions(rules, from, 2);

    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.startsAt.getDay()).toBe(1);
    expect(sessions[0]?.startsAt.getHours()).toBe(16);
    expect(sessions[0]?.startsAt.getMinutes()).toBe(0);
  });

  it("calcula endsAt sumando la duracion en minutos", () => {
    const from = new Date("2026-08-10T00:00:00");
    const rules = [{ weekDay: WeekDay.MONDAY, startTime: "16:00", durationMinutes: 45 }];

    const [session] = generateSessions(rules, from, 1);

    expect(session).toBeDefined();
    expect(session!.endsAt.getTime() - session!.startsAt.getTime()).toBe(45 * 60_000);
  });

  it("combina varias reglas en el mismo horizonte", () => {
    const from = new Date("2026-08-10T00:00:00");
    const rules = [
      { weekDay: WeekDay.MONDAY, startTime: "16:00", durationMinutes: 45 },
      { weekDay: WeekDay.WEDNESDAY, startTime: "17:00", durationMinutes: 45 },
    ];

    const sessions = generateSessions(rules, from, 1);

    expect(sessions).toHaveLength(2);
  });

  it("no genera sesiones para un horizonte de 0 semanas", () => {
    const from = new Date("2026-08-10T00:00:00");
    const rules = [{ weekDay: WeekDay.MONDAY, startTime: "16:00", durationMinutes: 45 }];

    expect(generateSessions(rules, from, 0)).toHaveLength(0);
  });
});
