import { randomBytes, createHash } from "node:crypto";

/** Duracion fija de sesion para M1 (sin renovacion deslizante todavia). */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface GeneratedSessionToken {
  /** Valor crudo: va en la cookie httpOnly, nunca se guarda en la base. */
  token: string;
  /** Hash SHA-256 del token: lo que se guarda en Session.tokenHash. */
  tokenHash: string;
}

export function generateSessionToken(): GeneratedSessionToken {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashSessionToken(token) };
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiryFromNow(now: Date = new Date()): Date {
  return new Date(now.getTime() + SESSION_TTL_MS);
}

export function isSessionExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
