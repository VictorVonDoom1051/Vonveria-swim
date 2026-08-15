import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

interface Attempt {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

/**
 * Limitador simple en memoria (Seccion 15: rate limiting en autenticacion).
 * Suficiente para una instancia unica del piloto; si en el futuro se corre
 * apps/api en varias instancias, esto necesitara moverse a Redis
 * (Seccion 8: solo cuando exista un caso real).
 */
@Injectable()
export class LoginRateLimiterService {
  private readonly attemptsByKey = new Map<string, Attempt>();

  assertAllowed(key: string): void {
    const now = Date.now();
    const attempt = this.attemptsByKey.get(key);

    if (!attempt || now - attempt.windowStart > WINDOW_MS) {
      this.attemptsByKey.set(key, { count: 1, windowStart: now });
      return;
    }

    if (attempt.count >= MAX_ATTEMPTS) {
      throw new HttpException({ errorCode: "AUTH_RATE_LIMITED" }, HttpStatus.TOO_MANY_REQUESTS);
    }

    attempt.count += 1;
  }
}
