import { describe, expect, it } from "vitest";
import { HttpException } from "@nestjs/common";
import { HealthController } from "./health.controller";
import type { PrismaService } from "../prisma/prisma.service";

function createPrismaServiceMock(queryRawImpl: () => Promise<unknown>): PrismaService {
  return {
    client: {
      $queryRaw: queryRawImpl,
    },
  } as unknown as PrismaService;
}

describe("HealthController", () => {
  it("getHealth responde ok sin depender de servicios externos", () => {
    const controller = new HealthController(createPrismaServiceMock(() => Promise.resolve([])));

    const result = controller.getHealth();

    expect(result.status).toBe("ok");
    expect(result.service).toBe("api");
  });

  it("getReady responde ok cuando la base de datos es alcanzable", async () => {
    const controller = new HealthController(
      createPrismaServiceMock(() => Promise.resolve([{ "?column?": 1 }])),
    );

    const result = await controller.getReady();

    expect(result.status).toBe("ok");
    expect(result.database).toBe("reachable");
  });

  it("getReady lanza 503 cuando la base de datos no es alcanzable", async () => {
    const controller = new HealthController(
      createPrismaServiceMock(() => Promise.reject(new Error("connection refused"))),
    );

    await expect(controller.getReady()).rejects.toBeInstanceOf(HttpException);
  });
});
