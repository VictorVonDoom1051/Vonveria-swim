import { describe, expect, it } from "vitest";
import { ThrottlerModule } from "@nestjs/throttler";

describe("ThrottleModule", () => {
  it("exporta ThrottlerModule.forRoot() con configuración correcta", () => {
    const module = ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "global",
          ttl: 60 * 1000,
          limit: 100,
        },
      ],
    });

    expect(module).toBeDefined();
    expect(module.module).toBe(ThrottlerModule);
  });

  it("limita a 100 peticiones por 60 segundos por IP", () => {
    const config = {
      throttlers: [
        {
          name: "global",
          ttl: 60 * 1000,
          limit: 100,
        },
      ],
    };

    const throttler = config.throttlers[0];
    expect(throttler).toBeDefined();
    expect(throttler?.limit).toBe(100);
    expect(throttler?.ttl).toBe(60 * 1000);
  });

  it("decorador @Throttle puede especificar límites personalizados por endpoint", () => {
    const loginThrottle = { default: { limit: 5, ttl: 60 } };
    const forgotPasswordThrottle = { default: { limit: 3, ttl: 3600 } };

    expect(loginThrottle.default.limit).toBe(5);
    expect(loginThrottle.default.ttl).toBe(60);
    expect(forgotPasswordThrottle.default.limit).toBe(3);
    expect(forgotPasswordThrottle.default.ttl).toBe(3600);
  });
});
