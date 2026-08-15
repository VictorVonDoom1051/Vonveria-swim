import { describe, expect, it } from "vitest";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { filterByCapability, MORE_NAV } from "./nav-config";

describe("filterByCapability", () => {
  it("oculta Configuracion cuando el usuario no tiene ninguna capacidad relevante", () => {
    const visible = filterByCapability(MORE_NAV, []);

    expect(visible.some((item) => item.href === "/settings/organization")).toBe(false);
  });

  it("muestra Configuracion cuando el usuario tiene al menos una capacidad relevante", () => {
    const visible = filterByCapability(MORE_NAV, [CAPABILITIES.AUDIT_VIEW]);

    expect(visible.some((item) => item.href === "/settings/organization")).toBe(true);
  });

  it("siempre muestra los items sin restriccion de capacidad", () => {
    const visible = filterByCapability(MORE_NAV, []);

    expect(visible.some((item) => item.href === "/instructores")).toBe(true);
  });
});
