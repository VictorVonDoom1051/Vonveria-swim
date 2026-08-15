import { describe, expect, it } from "vitest";
import { buildHeartbeatPayload } from "./heartbeat";

describe("buildHeartbeatPayload", () => {
  it("usa la clave fija worker_last_heartbeat y la fecha en ISO", () => {
    const now = new Date("2026-08-14T12:00:00.000Z");

    const payload = buildHeartbeatPayload(now);

    expect(payload.key).toBe("worker_last_heartbeat");
    expect(payload.value).toBe("2026-08-14T12:00:00.000Z");
  });
});
