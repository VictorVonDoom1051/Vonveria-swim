import { describe, expect, it } from "vitest";
import { CAPABILITIES } from "./capabilities";
import { hasCapability } from "./has-capability";

describe("hasCapability", () => {
  it("devuelve true cuando la capacidad esta en la lista del usuario", () => {
    expect(hasCapability([CAPABILITIES.AUDIT_VIEW], CAPABILITIES.AUDIT_VIEW)).toBe(true);
  });

  it("devuelve false cuando la capacidad no esta en la lista del usuario", () => {
    expect(hasCapability([CAPABILITIES.AUDIT_VIEW], CAPABILITIES.USERS_MANAGE)).toBe(false);
  });

  it("devuelve false con una lista vacia (rol sin capacidades, p. ej. Instructor en M1)", () => {
    expect(hasCapability([], CAPABILITIES.ORGANIZATION_MANAGE)).toBe(false);
  });
});
