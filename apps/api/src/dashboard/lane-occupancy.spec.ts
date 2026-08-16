import { describe, expect, it } from "vitest";
import { resolveLaneOccupancy } from "./lane-occupancy";

const sesion = (id: string, desde: string, hasta: string) => ({
  id,
  startsAt: new Date(desde),
  endsAt: new Date(hasta),
});

const NUEVE = sesion("nueve", "2026-08-17T09:00:00Z", "2026-08-17T10:00:00Z");
const ONCE = sesion("once", "2026-08-17T11:00:00Z", "2026-08-17T12:00:00Z");

describe("resolveLaneOccupancy", () => {
  it("marca ocupado durante la clase", () => {
    const estado = resolveLaneOccupancy([NUEVE, ONCE], new Date("2026-08-17T09:30:00Z"));
    expect(estado.current?.id).toBe("nueve");
    expect(estado.next).toBeNull();
  });

  it("el carril se ocupa justo al empezar", () => {
    const estado = resolveLaneOccupancy([NUEVE], new Date("2026-08-17T09:00:00Z"));
    expect(estado.current?.id).toBe("nueve");
  });

  it("a la hora de fin el carril ya esta libre", () => {
    const estado = resolveLaneOccupancy([NUEVE, ONCE], new Date("2026-08-17T10:00:00Z"));
    expect(estado.current).toBeNull();
    expect(estado.next?.id).toBe("once");
  });

  it("libre antes de la primera clase, anunciando cual sigue", () => {
    const estado = resolveLaneOccupancy([NUEVE, ONCE], new Date("2026-08-17T07:00:00Z"));
    expect(estado.current).toBeNull();
    expect(estado.next?.id).toBe("nueve");
  });

  it("despues de la ultima clase no hay siguiente", () => {
    const estado = resolveLaneOccupancy([NUEVE, ONCE], new Date("2026-08-17T20:00:00Z"));
    expect(estado.current).toBeNull();
    expect(estado.next).toBeNull();
  });

  it("un carril sin sesiones esta libre", () => {
    const estado = resolveLaneOccupancy([], new Date("2026-08-17T09:30:00Z"));
    expect(estado.current).toBeNull();
    expect(estado.next).toBeNull();
  });

  it("no depende del orden en que lleguen las sesiones", () => {
    const estado = resolveLaneOccupancy([ONCE, NUEVE], new Date("2026-08-17T07:00:00Z"));
    expect(estado.next?.id).toBe("nueve");
  });
});
