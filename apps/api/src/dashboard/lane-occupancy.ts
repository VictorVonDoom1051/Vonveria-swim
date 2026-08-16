export interface OccupancySession {
  id: string;
  startsAt: Date;
  endsAt: Date;
}

export interface LaneOccupancy<TSession extends OccupancySession> {
  /** Sesion en curso en este momento, si la hay. */
  current: TSession | null;
  /** Si esta libre, la siguiente sesion de hoy; sirve para decir hasta cuando lo esta. */
  next: TSession | null;
}

/**
 * Estado de un carril en un momento dado. Se separa del servicio para poder
 * probar los bordes (justo al empezar, justo al terminar) sin base de datos.
 *
 * Una sesion se considera en curso desde su inicio inclusive y hasta su fin
 * exclusive: a las 10:00 en punto la clase de 9 a 10 ya libero el carril.
 */
export function resolveLaneOccupancy<TSession extends OccupancySession>(
  sessions: readonly TSession[],
  now: Date,
): LaneOccupancy<TSession> {
  const ordered = [...sessions].sort(
    (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
  );

  const current =
    ordered.find((session) => session.startsAt <= now && now < session.endsAt) ?? null;
  const next = current ? null : (ordered.find((session) => session.startsAt > now) ?? null);

  return { current, next };
}
