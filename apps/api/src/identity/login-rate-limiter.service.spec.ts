import { describe, expect, it } from "vitest";
import { HttpException } from "@nestjs/common";
import { LoginRateLimiterService } from "./login-rate-limiter.service";

describe("LoginRateLimiterService", () => {
  it("permite hasta el limite de intentos por clave", () => {
    const limiter = new LoginRateLimiterService();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(() => limiter.assertAllowed("1.2.3.4")).not.toThrow();
    }
  });

  it("bloquea el intento que excede el limite", () => {
    const limiter = new LoginRateLimiterService();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      limiter.assertAllowed("1.2.3.4");
    }
    expect(() => limiter.assertAllowed("1.2.3.4")).toThrow(HttpException);
  });

  it("no comparte el contador entre claves (IPs) distintas", () => {
    const limiter = new LoginRateLimiterService();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      limiter.assertAllowed("1.2.3.4");
    }
    expect(() => limiter.assertAllowed("5.6.7.8")).not.toThrow();
  });
});
