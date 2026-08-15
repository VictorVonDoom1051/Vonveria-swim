import type { WeekDay } from "@vonveria-swim/database";

export interface TimeRange {
  weekDay: WeekDay;
  startTime: string; // "HH:mm"
  durationMinutes: number;
}

function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** Traslape de horario (Seccion 13: no superposicion de instructor, carril o recurso). */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  if (a.weekDay !== b.weekDay) {
    return false;
  }
  const aStart = toMinutes(a.startTime);
  const aEnd = aStart + a.durationMinutes;
  const bStart = toMinutes(b.startTime);
  const bEnd = bStart + b.durationMinutes;
  return aStart < bEnd && bStart < aEnd;
}
