export interface HeartbeatPayload {
  key: string;
  value: string;
}

/** Funcion pura: arma el payload del heartbeat a partir de una fecha dada. */
export function buildHeartbeatPayload(now: Date): HeartbeatPayload {
  return {
    key: "worker_last_heartbeat",
    value: now.toISOString(),
  };
}
