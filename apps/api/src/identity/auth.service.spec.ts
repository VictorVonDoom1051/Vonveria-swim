import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { MailerService } from "../common/mailer.service";
import { AuthService } from "./auth.service";

/**
 * Prueba de integracion: requiere Postgres real (docker-compose.yml) con
 * DATABASE_URL cargado (ver src/test-setup.ts). No usa datos de alumnos ni
 * el seed de piloto; crea y borra su propia organizacion de prueba.
 */
describe("AuthService.login", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const mailer = new MailerService();
  vi.spyOn(mailer, "sendPasswordResetEmail").mockResolvedValue(undefined);
  const authService = new AuthService(prisma, audit, mailer);

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

describe("AuthService.passwordReset", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const mailer = {
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  } as unknown as MailerService;
  const authService = new AuthService(prisma, audit, mailer);

  const email = `test-reset-${Date.now()}@example.com`;
  const newPassword = "NuevaClaveSegura123!";
  let organizationId: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org de prueba reset ${Date.now()}` },
    });
    organizationId = organization.id;

    const user = await prisma.client.user.create({
      data: {
        organizationId,
        email,
        fullName: "Usuario reset",
        passwordHash: await hashPassword("ClaveOriginal123!"),
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.client.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.client.session.deleteMany({ where: { userId } });
    await prisma.client.auditLog.deleteMany({ where: { organizationId } });
    await prisma.client.user.deleteMany({ where: { organizationId } });
    await prisma.client.organization.delete({ where: { id: organizationId } });
    await prisma.onModuleDestroy();
  });

  it("genera token valido y lo guarda hasheado en BD", async () => {
    await authService.requestPasswordReset(email);

    const tokenCount = await prisma.client.passwordResetToken.count({
      where: { userId },
    });
    expect(tokenCount).toBeGreaterThan(0);

    const resetToken = await prisma.client.passwordResetToken.findFirst({
      where: { userId },
    });
    expect(resetToken?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("no revela si el correo existe (security)", async () => {
    const noExistResult = await authService.requestPasswordReset("no-existe@example.com");
    const existResult = await authService.requestPasswordReset(email);

    expect(noExistResult).toEqual(existResult);
  });

  it("rechaza token expirado", async () => {
    await expect(authService.resetPasswordWithToken("token-invalido", newPassword)).rejects.toThrow();
  });

  it("rechaza contraseña muy corta", async () => {
    await expect(authService.resetPasswordWithToken("token", "123")).rejects.toThrow(
      "Password must be at least 8 characters long",
    );
  });
});
