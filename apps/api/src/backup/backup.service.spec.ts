import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { BackupService } from "./backup.service";

/**
 * Pruebas de integracion: requieren Postgres real (ver src/test-setup.ts).
 * Crean y borran su propia organizacion, no tocan el seed de piloto.
 */
describe("BackupService", () => {
  const prisma = new PrismaService();
  const backup = new BackupService(prisma);

  let organizationId: string;
  let otherOrganizationId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org respaldo ${Date.now()}` },
    });
    organizationId = organization.id;

    const otra = await prisma.client.organization.create({
      data: { name: `Org ajena respaldo ${Date.now()}` },
    });
    otherOrganizationId = otra.id;

    await prisma.client.user.create({
      data: {
        organizationId,
        email: `respaldo-${Date.now()}@example.com`,
        fullName: "Usuario Respaldo",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });

    const family = await prisma.client.family.create({ data: { organizationId } });
    await prisma.client.student.create({
      data: { organizationId, familyId: family.id, fullName: "María García Ñoño" },
    });

    const familiaAjena = await prisma.client.family.create({
      data: { organizationId: otherOrganizationId },
    });
    await prisma.client.student.create({
      data: {
        organizationId: otherOrganizationId,
        familyId: familiaAjena.id,
        fullName: "Alumno Ajeno",
      },
    });
  });

  afterAll(async () => {
    const ids = [organizationId, otherOrganizationId];
    await prisma.client.student.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.family.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.user.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.organization.deleteMany({ where: { id: { in: ids } } });
    await prisma.onModuleDestroy();
  });

  it("el respaldo nunca incluye el hash de contrasena", async () => {
    const data = await backup.exportAll(organizationId);

    expect(data.users).toHaveLength(1);
    expect(data.users[0]).not.toHaveProperty("passwordHash");
    // Ni siquiera serializado en otro lado del archivo.
    expect(JSON.stringify(data)).not.toContain("passwordHash");
  });

  it("el respaldo avisa que no trae contrasenas", async () => {
    const data = await backup.exportAll(organizationId);
    expect(data.meta.aviso).toContain("NO incluye contrasenas");
    expect(data.meta.organizationId).toBe(organizationId);
  });

  it("no mezcla datos de otra organizacion", async () => {
    const data = await backup.exportAll(organizationId);
    const nombres = data.students.map((student) => student.fullName);

    expect(nombres).toContain("María García Ñoño");
    expect(nombres).not.toContain("Alumno Ajeno");
  });

  it("el CSV de alumnos respeta el aislamiento por organizacion", async () => {
    const csv = await backup.buildCsvDataset(organizationId, "alumnos");

    expect(csv).toContain("María García Ñoño");
    expect(csv).not.toContain("Alumno Ajeno");
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("arma los cuatro listados sin fallar aunque esten vacios", async () => {
    for (const dataset of ["alumnos", "pagos", "asistencias", "inventario"] as const) {
      const csv = await backup.buildCsvDataset(organizationId, dataset);
      expect(csv.length).toBeGreaterThan(1);
    }
  });
});
