/**
 * La anualidad se cobra en cada aniversario de la fecha de inicio de la
 * inscripcion, no en enero: una familia que entra en agosto renueva en agosto.
 *
 * ANNUAL_PERIOD_MONTH existe por una razon concreta. La mensualidad es
 * idempotente gracias a la restriccion unica [enrollmentId, periodYear,
 * periodMonth] en Charge, pero en Postgres dos NULL no se consideran iguales:
 * guardar la anualidad con periodMonth nulo permitiria insertar dos del mismo
 * año. El mes cero no existe en un calendario, asi que no puede chocar con
 * ninguna mensualidad real y la restriccion si protege.
 */
export const ANNUAL_PERIOD_MONTH = 0;

export interface AnnualPeriod {
  periodYear: number;
  /** Aniversario que corresponde a ese periodo; sirve como fecha de vencimiento. */
  dueDate: Date;
}

/**
 * Periodo anual vigente en una fecha dada. Si el aniversario de este año todavia
 * no llega, el periodo vigente sigue siendo el del año pasado.
 */
export function resolveAnnualPeriod(startDate: Date, referenceDate: Date): AnnualPeriod {
  const anniversaryThisYear = new Date(startDate);
  anniversaryThisYear.setFullYear(referenceDate.getFullYear());

  const alreadyHappened =
    anniversaryThisYear.getTime() <= referenceDate.getTime() ||
    isSameDay(anniversaryThisYear, referenceDate);

  const periodYear = alreadyHappened
    ? referenceDate.getFullYear()
    : referenceDate.getFullYear() - 1;

  const dueDate = new Date(startDate);
  dueDate.setFullYear(periodYear);

  return { periodYear, dueDate };
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
