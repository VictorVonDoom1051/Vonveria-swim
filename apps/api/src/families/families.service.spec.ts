import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { FamiliesService } from "./families.service";

/**
 * Pruebas de integracion: requieren Postgres real (ver src/test-setup.ts).
 * Crean y borran sus propias organizaciones, no tocan el seed de piloto.
 */
describe("FamiliesService aislamiento por organizacion", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const familiesService = new FamiliesService(prisma, audit);

  let organizationAId: string;
  let organizationBId: string;
  const sharedName = `Alumno Compartido ${Date.now()}`;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const orgA = await prisma.client.organization.create({
      data: { name: `Org A aislamiento ${Date.now()}` },
    });
    const orgB = await prisma.client.organization.create({
      data: { name: `Org B aislamiento ${Date.now()}` },
    });
    organizationAId = orgA.id;
    organizationBId = orgB.id;

    const passwordHash = await hashPassword("ClaveDePrueba123!");
    const actorA = await prisma.client.user.create({
      data: {
        organizationId: organizationAId,
        email: `actor-a-${Date.now()}@example.com`,
        fullName: "Actor A",
        passwordHash,
      },
    });
    const actorB = await prisma.client.user.create({
      data: {
        organizationId: organizationBId,
        email: `actor-b-${Date.now()}@example.com`,
        fullName: "Actor B",
        passwordHash,
      },
    });

    // Mismo nombre de alumno en dos organizaciones distintas, a proposito.
    await familiesService.createFamily(organizationAId, actorA.id, { fullName: "Tutor A" });
    const familyA = (await familiesService.search(organizationAId, "Tutor A"))[0]!;
    await familiesService.createStudent(organizationAId, actorA.id, familyA.id, { fullName: sharedName });

    await familiesService.createFamily(organizationBId, actorB.id, { fullName: "Tutor B" });
    const familyB = (await familiesService.search(organizationBId, "Tutor B"))[0]!;
    await familiesService.createStudent(organizationBId, actorB.id, familyB.id, { fullName: sharedName });
  });

  afterAll(async () => {
    for (const organizationId of [organizationAId, organizationBId]) {
      await prisma.client.student.deleteMany({ where: { organizationId } });
      await prisma.client.guardian.deleteMany({ where: { family: { organizationId } } });
      await prisma.client.family.deleteMany({ where: { organizationId } });
      await prisma.client.auditLog.deleteMany({ where: { organizationId } });
      await prisma.client.user.deleteMany({ where: { organizationId } });
      await prisma.client.organization.delete({ where: { id: organizationId } });
    }
    await prisma.onModuleDestroy();
  });

  it("la busqueda en la organizacion A no devuelve familias de la organizacion B", async () => {
    const results = await familiesService.search(organizationAId, sharedName);

    expect(results).toHaveLength(1);
    expect(results[0]?.students.every((student) => student.fullName === sharedName)).toBe(true);
  });

  it("la busqueda en la organizacion B no devuelve familias de la organizacion A", async () => {
    const results = await familiesService.search(organizationBId, sharedName);

    expect(results).toHaveLength(1);
  });
});
