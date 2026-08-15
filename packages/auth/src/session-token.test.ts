import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  hashSessionToken,
  isSessionExpired,
  sessionExpiryFromNow,
  SESSION_TTL_MS,
} from "./session-token";

describe("generateSessionToken", () => {
  it("el hash devuelto coincide con hashear el token por separado", () => {
    const { token, tokenHash } = generateSessionToken();

    expect(hashSessionToken(token)).toBe(tokenHash);
  });

  it("genera tokens distintos en cada llamada", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();

    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });
});

describe("sessionExpiryFromNow / isSessionExpired", () => {
  it("calcula el vencimiento a partir de SESSION_TTL_MS", () => {
    const now = new Date("2026-08-14T12:00:00.000Z");

    const expiry = sessionExpiryFromNow(now);

    expect(expiry.getTime() - now.getTime()).toBe(SESSION_TTL_MS);
  });

  it("marca como expirada una sesion cuyo vencimiento ya paso", () => {
    const expiresAt = new Date("2026-08-14T12:00:00.000Z");
    const later = new Date("2026-08-14T12:00:00.001Z");

    expect(isSessionExpired(expiresAt, later)).toBe(true);
  });

  it("no marca como expirada una sesion vigente", () => {
    const expiresAt = new Date("2026-08-14T12:00:00.000Z");
    const earlier = new Date("2026-08-14T11:59:59.999Z");

    expect(isSessionExpired(expiresAt, earlier)).toBe(false);
  });
});
