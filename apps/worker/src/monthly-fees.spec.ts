import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPrismaClient, type PrismaClient } from "@vonveria-swim/database";
import { runMonthlyFeeGeneration } from "./monthly-fees";

/**
 * Prueba de integracion: requiere Postgres real (ver src/test-setup.ts).
 * Crea y borra su propia organizacion, no toca el seed de piloto.
 */
describe("runMonthlyFeeGeneration", () => {
  const prisma: PrismaClient = getPrismaClient();

  let organizationId: string;
  let enrollmentId: string;

  beforeAll(async () => {
    const organization = await prisma.organization.create({
      data: { name: `Org de prueba mensualidades ${Date.now()}` },
    });
    organizationId = organization.id;

    const branch = await prisma.branch.create({ data: { organizationId, name: "Sucursal" } });
    const pool = await prisma.pool.create({ data: { branchId: branch.id, name: "Alberca" } });
    const program = await prisma.program.create({ data: { organizationId, name: "Programa" } });
    const level = await prisma.level.create({ data: { programId: program.id, name: "Nivel" } });
    const group = await prisma.group.create({
      data: {
        organizationId,
        name: "Grupo mensualidad",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        capacity: 10,
      },
    });

    const family = await prisma.family.create({ data: { organizationId } });
    const student = await prisma.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno mensualidad" },
    });

    const enrollment = await prisma.enrollment.create({
      data: {
        organizationId,
        studentId: student.id,
        groupId: group.id,
        startDate: new Date(),
        billingModality: "MONTHLY",
        monthlyRateAmount: "450.00",
        monthlyDueDay: 5,
      },
    });
    enrollmentId = enrollment.id;
  });

  afterAll(async () => {
    await prisma.charge.deleteMany({ where: { organizationId } });
    await prisma.enrollment.deleteMany({ where: { organizationId } });
    await prisma.student.deleteMany({ where: { organizationId } });
    await prisma.family.deleteMany({ where: { organizationId } });
    await prisma.group.deleteMany({ where: { organizationId } });
    await prisma.level.deleteMany({ where: { program: { organizationId } } });
    await prisma.program.deleteMany({ where: { organizationId } });
    await prisma.pool.deleteMany({ where: { branch: { organizationId } } });
    await prisma.branch.deleteMany({ where: { organizationId } });
    await prisma.organization.delete({ where: { id: organizationId } });
  });

  it("genera un cargo del mes para una inscripcion MONTHLY activa", async () => {
    const created = await runMonthlyFeeGeneration(prisma, new Date(Date.UTC(2026, 8, 1)));
    expect(created).toBe(1);

    const charges = await prisma.charge.findMany({ where: { enrollmentId } });
    expect(charges).toHaveLength(1);
    expect(charges[0]?.type).toBe("MONTHLY_FEE");
    expect(charges[0]?.periodYear).toBe(2026);
    expect(charges[0]?.periodMonth).toBe(9);
  });

  it("correr el job de nuevo el mismo mes no duplica el cargo (idempotencia)", async () => {
    const created = await runMonthlyFeeGeneration(prisma, new Date(Date.UTC(2026, 8, 15)));
    expect(created).toBe(0);

    const charges = await prisma.charge.findMany({ where: { enrollmentId } });
    expect(charges).toHaveLength(1);
  });

  it("un mes distinto si genera un cargo nuevo", async () => {
    const created = await runMonthlyFeeGeneration(prisma, new Date(Date.UTC(2026, 9, 1)));
    expect(created).toBe(1);

    const charges = await prisma.charge.findMany({ where: { enrollmentId }, orderBy: { periodMonth: "asc" } });
    expect(charges).toHaveLength(2);
    expect(charges[1]?.periodMonth).toBe(10);
  });
});
