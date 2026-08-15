import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "./auth.service";

/**
 * Prueba de integracion: requiere Postgres real (docker-compose.yml) con
 * DATABASE_URL cargado (ver src/test-setup.ts). No usa datos de alumnos ni
 * el seed de piloto; crea y borra su propia organizacion de prueba.
 */
describe("AuthService.login", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const authService = new AuthService(prisma, audit);

  const email = `test-auth-${Date.now()}@example.com`;
  const password = "ClaveDePrueba123!";
  let organizationId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org de prueba auth ${Date.now()}` },
    });
    organizationId = organization.id;

    await prisma.client.user.create({
      data: {
        organizationId,
        email,
        fullName: "Usuario de prueba",
        passwordHash: await hashPassword(password),
      },
    });
  });

  afterAll(async () => {
    await prisma.client.session.deleteMany({ where: { user: { organizationId } } });
    await prisma.client.auditLog.deleteMany({ where: { organizationId } });
    await prisma.client.user.deleteMany({ where: { organizationId } });
    await prisma.client.organization.delete({ where: { id: organizationId } });
    await prisma.onModuleDestroy();
  });

  it("inicia sesion con credenciales validas y crea una Session", async () => {
    const result = await authService.login(email, password, {});

    expect(result.user.email).toBe(email);
    expect(result.user.capabilities).toEqual([]);

    const sessionCount = await prisma.client.session.count({
      where: { user: { organizationId } },
    });
    expect(sessionCount).toBe(1);
  });

  it("rechaza una contrasena incorrecta", async () => {
    await expect(authService.login(email, "clave-incorrecta", {})).rejects.toThrow();
  });

  it("rechaza un correo que no existe", async () => {
    await expect(authService.login("no-existe@example.com", password, {})).rejects.toThrow();
  });
});
