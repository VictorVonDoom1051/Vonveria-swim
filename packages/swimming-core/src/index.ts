export interface MonthlyChargePeriod {
  periodYear: number;
  periodMonth: number;
  dueDate: Date;
}

/**
 * Resuelve el periodo (ano/mes) y la fecha de vencimiento de una mensualidad
 * para el mes que contiene `referenceDate`, ajustando el dia de vencimiento
 * a los dias reales del mes (ej. dueDay=31 en febrero -> 28/29).
 */
export function resolveMonthlyChargePeriod(
  referenceDate: Date,
  dueDay: number,
): MonthlyChargePeriod {
  const periodYear = referenceDate.getUTCFullYear();
  const periodMonth = referenceDate.getUTCMonth() + 1;
  const daysInMonth = new Date(Date.UTC(periodYear, periodMonth, 0)).getUTCDate();
  const clampedDay = Math.min(dueDay, daysInMonth);
  const dueDate = new Date(Date.UTC(periodYear, periodMonth - 1, clampedDay));
  return { periodYear, periodMonth, dueDate };
}
