import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPrismaClient, type PrismaClient } from "@vonveria-swim/database";
import { runAnnualFeeGeneration } from "./annual-fees";

/**
 * Prueba de integracion: requiere Postgres real (ver src/test-setup.ts).
 * Crea y borra su propia organizacion, no toca el seed de piloto.
 */
describe("runAnnualFeeGeneration", () => {
  const prisma: PrismaClient = getPrismaClient();

  let organizationId: string;
  let enrollmentId: string;
  let sinAnualidadId: string;

  const inicio = new Date(Date.UTC(2026, 7, 20));

  beforeAll(async () => {
    const organization = await prisma.organization.create({
      data: { name: `Org de prueba anualidades ${Date.now()}` },
    });
    organizationId = organization.id;

    const branch = await prisma.branch.create({ data: { organizationId, name: "Sucursal" } });
    const pool = await prisma.pool.create({ data: { branchId: branch.id, name: "Alberca" } });
    const program = await prisma.program.create({ data: { organizationId, name: "Programa" } });
    const level = await prisma.level.create({ data: { programId: program.id, name: "Nivel" } });
    const group = await prisma.group.create({
      data: {
        organizationId,
        name: "Grupo anualidad",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        capacity: 10,
      },
    });

    const family = await prisma.family.create({ data: { organizationId } });
    const student = await prisma.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno anualidad" },
    });
    const otroStudent = await prisma.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno sin anualidad" },
    });

    const enrollment = await prisma.enrollment.create({
      data: {
        organizationId,
        studentId: student.id,
        groupId: group.id,
        startDate: inicio,
        annualFeeAmount: "800.00",
      },
    });
    enrollmentId = enrollment.id;

    // Inscripcion heredada de antes de la anualidad: el job debe ignorarla en
    // lugar de inventarle un monto.
    const sinAnualidad = await prisma.enrollment.create({
      data: {
        organizationId,
        studentId: otroStudent.id,
        groupId: group.id,
        startDate: inicio,
      },
    });
    sinAnualidadId = sinAnualidad.id;
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

  it("genera la anualidad del periodo vigente", async () => {
    const created = await runAnnualFeeGeneration(prisma, new Date(Date.UTC(2026, 8, 1)));
    expect(created).toBe(1);

    const charges = await prisma.charge.findMany({ where: { enrollmentId } });
    expect(charges).toHaveLength(1);
    expect(charges[0]?.type).toBe("ANNUAL_FEE");
    expect(charges[0]?.periodYear).toBe(2026);
    expect(charges[0]?.periodMonth).toBe(0);
  });

  it("correr el job de nuevo el mismo año no duplica el cargo (idempotencia)", async () => {
    const created = await runAnnualFeeGeneration(prisma, new Date(Date.UTC(2026, 11, 31)));
    expect(created).toBe(0);

    const charges = await prisma.charge.findMany({ where: { enrollmentId } });
    expect(charges).toHaveLength(1);
  });

  it("antes del aniversario siguiente no cobra nada", async () => {
    const created = await runAnnualFeeGeneration(prisma, new Date(Date.UTC(2027, 7, 19)));
    expect(created).toBe(0);

    const charges = await prisma.charge.findMany({ where: { enrollmentId } });
    expect(charges).toHaveLength(1);
  });

  it("al cumplirse el aniversario genera la del año nuevo", async () => {
    const created = await runAnnualFeeGeneration(prisma, new Date(Date.UTC(2027, 7, 20)));
    expect(created).toBe(1);

    const charges = await prisma.charge.findMany({
      where: { enrollmentId },
      orderBy: { periodYear: "asc" },
    });
    expect(charges).toHaveLength(2);
    expect(charges[1]?.periodYear).toBe(2027);
    expect(charges[1]?.amount.toString()).toBe("800");
  });

  it("ignora las inscripciones sin monto de anualidad", async () => {
    const charges = await prisma.charge.findMany({ where: { enrollmentId: sinAnualidadId } });
    expect(charges).toHaveLength(0);
  });

  it("un alumno con dos inscripciones activas paga una sola anualidad del año", async () => {
    const original = await prisma.enrollment.findUniqueOrThrow({ where: { id: enrollmentId } });

    const segunda = await prisma.enrollment.create({
      data: {
        organizationId: original.organizationId,
        studentId: original.studentId,
        groupId: original.groupId,
        startDate: inicio,
        annualFeeAmount: "800.00",
      },
    });

    // 2028 no se ha cobrado para ninguna de las dos: sin la regla por alumno,
    // esta corrida generaria dos cargos del mismo año.
    const created = await runAnnualFeeGeneration(prisma, new Date(Date.UTC(2028, 7, 20)));
    expect(created).toBe(1);

    const anualidades = await prisma.charge.count({
      where: { studentId: original.studentId, type: "ANNUAL_FEE", periodYear: 2028 },
    });
    expect(anualidades).toBe(1);

    await prisma.charge.deleteMany({ where: { enrollmentId: segunda.id } });
    await prisma.enrollment.delete({ where: { id: segunda.id } });
  });
});
