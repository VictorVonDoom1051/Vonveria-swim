import { describe, expect, it } from "vitest";
import { generateTemporaryPassword, hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("verifica correctamente una contrasena con su propio hash", async () => {
    const hash = await hashPassword("S3guridad!Piscina");

    await expect(verifyPassword(hash, "S3guridad!Piscina")).resolves.toBe(true);
  });

  it("rechaza una contrasena incorrecta", async () => {
    const hash = await hashPassword("S3guridad!Piscina");

    await expect(verifyPassword(hash, "otra-contrasena")).resolves.toBe(false);
  });

  it("no lanza excepcion con un hash invalido, solo devuelve false", async () => {
    await expect(verifyPassword("no-es-un-hash-valido", "algo")).resolves.toBe(false);
  });
});

describe("generateTemporaryPassword", () => {
  it("genera contrasenas de la longitud pedida y sin caracteres ambiguos", () => {
    const password = generateTemporaryPassword(12);

    expect(password).toHaveLength(12);
    expect(password).not.toMatch(/[0O1lI]/);
  });

  it("genera valores distintos en llamadas sucesivas", () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword();

    expect(a).not.toBe(b);
  });
});
