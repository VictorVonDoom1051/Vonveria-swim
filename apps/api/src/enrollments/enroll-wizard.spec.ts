import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { ANNUAL_PERIOD_MONTH } from "@vonveria-swim/swimming-core";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { EnrollmentsService } from "./enrollments.service";

/**
 * Pruebas de integracion: requieren Postgres real (ver src/test-setup.ts).
 * Crean y borran su propia organizacion, no tocan el seed de piloto.
 */
describe("EnrollmentsService.enrollFromWizard", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const enrollmentsService = new EnrollmentsService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let groupId: string;
  let segundoGrupoId: string;
  let smallGroupId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org wizard ${Date.now()}` },
    });
    organizationId = organization.id;

    const actor = await prisma.client.user.create({
      data: {
        organizationId,
        email: `wizard-${Date.now()}@example.com`,
        fullName: "Recepcion",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });
    actorUserId = actor.id;

    const branch = await prisma.client.branch.create({
      data: { organizationId, name: "Sucursal" },
    });
    const pool = await prisma.client.pool.create({
      data: { branchId: branch.id, name: "Alberca" },
    });
    const program = await prisma.client.program.create({
      data: { organizationId, name: "Programa" },
    });
    const level = await prisma.client.level.create({
      data: { programId: program.id, name: "Nivel" },
    });

    const group = await prisma.client.group.create({
      data: {
        organizationId,
        name: "Grupo amplio",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        capacity: 20,
      },
    });
    groupId = group.id;

    const segundoGrupo = await prisma.client.group.create({
      data: {
        organizationId,
        name: "Segundo grupo amplio",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        capacity: 20,
      },
    });
    segundoGrupoId = segundoGrupo.id;

    const smallGroup = await prisma.client.group.create({
      data: {
        organizationId,
        name: "Grupo de un lugar",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        capacity: 1,
      },
    });
    smallGroupId = smallGroup.id;
  });

  afterAll(async () => {
    await prisma.client.charge.deleteMany({ where: { organizationId } });
    await prisma.client.enrollmentStatusHistory.deleteMany({
      where: { enrollment: { organizationId } },
    });
    await prisma.client.enrollment.deleteMany({ where: { organizationId } });
    await prisma.client.auditLog.deleteMany({ where: { organizationId } });
    await prisma.client.student.deleteMany({ where: { organizationId } });
    await prisma.client.guardian.deleteMany({ where: { family: { organizationId } } });
    await prisma.client.family.deleteMany({ where: { organizationId } });
    await prisma.client.group.deleteMany({ where: { organizationId } });
    await prisma.client.level.deleteMany({ where: { program: { organizationId } } });
    await prisma.client.program.deleteMany({ where: { organizationId } });
    await prisma.client.pool.deleteMany({ where: { branch: { organizationId } } });
    await prisma.client.branch.deleteMany({ where: { organizationId } });
    await prisma.client.user.deleteMany({ where: { organizationId } });
    await prisma.client.organization.delete({ where: { id: organizationId } });
    await prisma.onModuleDestroy();
  });

  it("crea familia, tutor, alumno e inscripcion en una sola llamada", async () => {
    const enrollment = await enrollmentsService.enrollFromWizard(organizationId, actorUserId, {
      newGuardian: { fullName: "Maria Gonzalez", phone: "5512345678" },
      newStudent: { fullName: "Sofia Gonzalez", birthDate: "2018-05-10" },
      groupId,
      startDate: "2026-09-01",
      annualFeeAmount: "800.00",
      enrollmentFeeAmount: "300.00",
      billingModality: "MONTHLY",
      monthlyRateAmount: "1500.00",
      monthlyDueDay: 5,
    });

    expect(enrollment.status).toBe("ACTIVE");

    const student = await prisma.client.student.findUniqueOrThrow({
      where: { id: enrollment.studentId },
      include: { family: { include: { guardians: true } } },
    });
    expect(student.fullName).toBe("Sofia Gonzalez");
    expect(student.family.guardians[0]?.fullName).toBe("Maria Gonzalez");

    const charges = await prisma.client.charge.findMany({
      where: { enrollmentId: enrollment.id },
    });
    const types = charges.map((charge) => charge.type).sort();
    expect(types).toEqual(["ANNUAL_FEE", "ENROLLMENT_FEE", "MONTHLY_FEE"]);

    const annual = charges.find((charge) => charge.type === "ANNUAL_FEE");
    expect(annual?.amount.toString()).toBe("800");
    expect(annual?.periodYear).toBe(2026);
    // Mes cero: no existe en el calendario, asi que la restriccion unica
    // [enrollmentId, periodYear, periodMonth] si protege contra duplicados.
    expect(annual?.periodMonth).toBe(ANNUAL_PERIOD_MONTH);
  });

  it("no vuelve a cobrar inscripcion a un alumno que ya la pago, pero si la anualidad", async () => {
    const primera = await enrollmentsService.enrollFromWizard(organizationId, actorUserId, {
      newGuardian: { fullName: "Tutor Reinscripcion" },
      newStudent: { fullName: "Alumno Reinscrito" },
      groupId,
      startDate: "2026-01-15",
      annualFeeAmount: "800.00",
      enrollmentFeeAmount: "300.00",
    });

    const segunda = await enrollmentsService.enrollFromWizard(organizationId, actorUserId, {
      studentId: primera.studentId,
      groupId: smallGroupId,
      startDate: "2027-01-15",
      annualFeeAmount: "900.00",
      enrollmentFeeAmount: "300.00",
    });

    const inscripciones = await prisma.client.charge.count({
      where: { studentId: primera.studentId, type: "ENROLLMENT_FEE" },
    });
    expect(inscripciones).toBe(1);

    const anualidades = await prisma.client.charge.findMany({
      where: { studentId: primera.studentId, type: "ANNUAL_FEE" },
      orderBy: { periodYear: "asc" },
    });
    expect(anualidades.map((charge) => charge.periodYear)).toEqual([2026, 2027]);
    expect(segunda.annualFeeAmount?.toString()).toBe("900");
  });

  it("un alumno en dos grupos paga una sola anualidad del año", async () => {
    const primera = await enrollmentsService.enrollFromWizard(organizationId, actorUserId, {
      newGuardian: { fullName: "Tutor Dos Grupos" },
      newStudent: { fullName: "Alumno Dos Grupos" },
      groupId,
      startDate: "2026-03-01",
      annualFeeAmount: "800.00",
    });

    // Mismo año, otro grupo: es lo que pasa al cambiar de nivel, porque hoy la
    // inscripcion anterior no se cierra.
    await enrollmentsService.enrollFromWizard(organizationId, actorUserId, {
      studentId: primera.studentId,
      groupId: segundoGrupoId,
      startDate: "2026-06-01",
      annualFeeAmount: "800.00",
    });

    const anualidades = await prisma.client.charge.count({
      where: { studentId: primera.studentId, type: "ANNUAL_FEE", periodYear: 2026 },
    });
    expect(anualidades).toBe(1);
  });

  it("si el grupo esta lleno no deja familia ni alumno a medias", async () => {
    const antesFamilias = await prisma.client.family.count({ where: { organizationId } });
    const antesAlumnos = await prisma.client.student.count({ where: { organizationId } });

    await expect(
      enrollmentsService.enrollFromWizard(organizationId, actorUserId, {
        newGuardian: { fullName: "Tutor Rechazado" },
        newStudent: { fullName: "Alumno Rechazado" },
        groupId: smallGroupId,
        startDate: "2026-09-01",
        annualFeeAmount: "800.00",
      }),
    ).rejects.toThrow();

    expect(await prisma.client.family.count({ where: { organizationId } })).toBe(antesFamilias);
    expect(await prisma.client.student.count({ where: { organizationId } })).toBe(antesAlumnos);
  });

  it("rechaza un alumno de otra organizacion (Seccion 19: aislamiento)", async () => {
    const otra = await prisma.client.organization.create({
      data: { name: `Org ajena wizard ${Date.now()}` },
    });
    const familiaAjena = await prisma.client.family.create({
      data: { organizationId: otra.id },
    });
    const alumnoAjeno = await prisma.client.student.create({
      data: { organizationId: otra.id, familyId: familiaAjena.id, fullName: "Alumno Ajeno" },
    });

    await expect(
      enrollmentsService.enrollFromWizard(organizationId, actorUserId, {
        studentId: alumnoAjeno.id,
        groupId,
        startDate: "2026-09-01",
        annualFeeAmount: "800.00",
      }),
    ).rejects.toThrow();

    await prisma.client.student.delete({ where: { id: alumnoAjeno.id } });
    await prisma.client.family.delete({ where: { id: familiaAjena.id } });
    await prisma.client.organization.delete({ where: { id: otra.id } });
  });

  it("exige capturar o elegir un alumno", async () => {
    await expect(
      enrollmentsService.enrollFromWizard(organizationId, actorUserId, {
        groupId,
        startDate: "2026-09-01",
        annualFeeAmount: "800.00",
      }),
    ).rejects.toThrow();
  });
});
