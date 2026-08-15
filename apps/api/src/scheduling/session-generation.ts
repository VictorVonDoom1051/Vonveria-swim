import { WeekDay } from "@vonveria-swim/database";
import type { TimeRange } from "./schedule-overlap";

/**
 * Horizonte fijo de generacion (Seccion 13 de CLAUDE.md: "se generan sesiones
 * futuras dentro del horizonte configurado"). Constante documentada, no hay
 * UI para cambiarla todavia (ver plan de M2 - decision conservadora).
 */
export const SESSION_GENERATION_HORIZON_WEEKS = 8;

const WEEKDAY_TO_JS_INDEX: Record<WeekDay, number> = {
  [WeekDay.SUNDAY]: 0,
  [WeekDay.MONDAY]: 1,
  [WeekDay.TUESDAY]: 2,
  [WeekDay.WEDNESDAY]: 3,
  [WeekDay.THURSDAY]: 4,
  [WeekDay.FRIDAY]: 5,
  [WeekDay.SATURDAY]: 6,
};

export interface GeneratedSession {
  startsAt: Date;
  endsAt: Date;
}

/**
 * Genera las ocurrencias concretas de un conjunto de reglas recurrentes.
 * Limitacion conocida: usa la hora local del proceso, no convierte
 * explicitamente a la zona horaria de la organizacion (Organization.timezone).
 * Aceptable para el piloto (una sola zona horaria); revisar antes de M6
 * si el servidor llega a correr en UTC en produccion.
 */
export function generateSessions(
  rules: readonly TimeRange[],
  from: Date,
  horizonWeeks: number = SESSION_GENERATION_HORIZON_WEEKS,
): GeneratedSession[] {
  const sessions: GeneratedSession[] = [];
  const totalDays = horizonWeeks * 7;

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset += 1) {
    const date = new Date(from);
    date.setDate(date.getDate() + dayOffset);
    const jsWeekDayIndex = date.getDay();

    for (const rule of rules) {
      if (WEEKDAY_TO_JS_INDEX[rule.weekDay] !== jsWeekDayIndex) {
        continue;
      }

      const [hours, minutes] = rule.startTime.split(":").map(Number);
      const startsAt = new Date(date);
      startsAt.setHours(hours ?? 0, minutes ?? 0, 0, 0);
      const endsAt = new Date(startsAt.getTime() + rule.durationMinutes * 60_000);

      sessions.push({ startsAt, endsAt });
    }
  }

  return sessions;
}
