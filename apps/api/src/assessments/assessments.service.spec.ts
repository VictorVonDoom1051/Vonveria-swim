import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AssessmentsService } from "./assessments.service";

/**
 * Pruebas de integracion: requieren Postgres real (ver src/test-setup.ts).
 * Crean y borran su propia organizacion, no tocan el seed de piloto.
 */
describe("AssessmentsService", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const assessments = new AssessmentsService(prisma, audit);

  let organizationId: string;
  let instructorId: string;
  let direccionId: string;
  let alumnoPropioId: string;
  let alumnoAjenoId: string;
  let levelId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org evaluaciones ${Date.now()}` },
    });
    organizationId = organization.id;

    const instructor = await prisma.client.user.create({
      data: {
        organizationId,
        email: `instructor-eval-${Date.now()}@example.com`,
        fullName: "Maestra Evaluadora",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });
    instructorId = instructor.id;

    const direccion = await prisma.client.user.create({
      data: {
        organizationId,
        email: `direccion-eval-${Date.now()}@example.com`,
        fullName: "Direccion Evaluadora",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });
    direccionId = direccion.id;

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
      data: { programId: program.id, name: "Nivel 2" },
    });
    levelId = level.id;

    const grupoPropio = await prisma.client.group.create({
      data: {
        organizationId,
        name: "Grupo de la maestra",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        instructorId: instructor.id,
        capacity: 10,
      },
    });
    const grupoAjeno = await prisma.client.group.create({
      data: {
        organizationId,
        name: "Grupo de otro",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        capacity: 10,
      },
    });

    const family = await prisma.client.family.create({ data: { organizationId } });

    const propio = await prisma.client.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno Propio" },
    });
    alumnoPropioId = propio.id;
    await prisma.client.enrollment.create({
      data: {
        organizationId,
        studentId: propio.id,
        groupId: grupoPropio.id,
        startDate: new Date(),
      },
    });

    const ajeno = await prisma.client.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno Ajeno" },
    });
    alumnoAjenoId = ajeno.id;
    await prisma.client.enrollment.create({
      data: {
        organizationId,
        studentId: ajeno.id,
        groupId: grupoAjeno.id,
        startDate: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.client.assessment.deleteMany({ where: { organizationId } });
    await prisma.client.enrollment.deleteMany({ where: { organizationId } });
    await prisma.client.group.deleteMany({ where: { organizationId } });
    await prisma.client.student.deleteMany({ where: { organizationId } });
    await prisma.client.family.deleteMany({ where: { organizationId } });
    await prisma.client.level.deleteMany({ where: { program: { organizationId } } });
    await prisma.client.program.deleteMany({ where: { organizationId } });
    await prisma.client.pool.deleteMany({ where: { branch: { organizationId } } });
    await prisma.client.branch.deleteMany({ where: { organizationId } });
    await prisma.client.auditLog.deleteMany({ where: { organizationId } });
    await prisma.client.user.deleteMany({ where: { organizationId } });
    await prisma.client.organization.deleteMany({ where: { id: organizationId } });
    await prisma.onModuleDestroy();
  });

  it("el instructor solo ve como evaluables a los alumnos de sus grupos", async () => {
    const propios = await assessments.listAssessableStudents(organizationId, instructorId, false);
    const nombres = propios.map((student) => student.fullName);

    expect(nombres).toContain("Alumno Propio");
    expect(nombres).not.toContain("Alumno Ajeno");
  });

  it("quien administra alumnos ve a todos", async () => {
    const todos = await assessments.listAssessableStudents(organizationId, direccionId, true);
    const nombres = todos.map((student) => student.fullName);

    expect(nombres).toContain("Alumno Propio");
    expect(nombres).toContain("Alumno Ajeno");
  });

  it("el instructor puede evaluar a su alumno y queda auditado", async () => {
    const assessment = await assessments.create(organizationId, instructorId, false, {
      studentId: alumnoPropioId,
      observation: "Flota sin apoyo y respira de lado.",
      suggestedLevelId: levelId,
    });

    expect(assessment.student.fullName).toBe("Alumno Propio");
    expect(assessment.suggestedLevel?.name).toBe("Nivel 2");

    const log = await prisma.client.auditLog.findFirst({
      where: { organizationId, action: "assessments.create", entityId: assessment.id },
    });
    expect(log).not.toBeNull();
    expect(log?.actorUserId).toBe(instructorId);
  });

  it("el instructor NO puede evaluar a un alumno ajeno aunque fuerce la peticion", async () => {
    await expect(
      assessments.create(organizationId, instructorId, false, {
        studentId: alumnoAjenoId,
        observation: "Intento indebido",
      }),
    ).rejects.toMatchObject({ response: { errorCode: "STUDENT_NOT_ASSESSABLE" } });
  });

  it("el instructor solo ve en el listado las evaluaciones de sus alumnos", async () => {
    await assessments.create(organizationId, direccionId, true, {
      studentId: alumnoAjenoId,
      observation: "Evaluacion hecha por Direccion a un alumno ajeno al instructor",
    });

    const delInstructor = await assessments.list(organizationId, instructorId, false);
    const deDireccion = await assessments.list(organizationId, direccionId, true);

    expect(delInstructor.every((item) => item.student.fullName === "Alumno Propio")).toBe(true);
    expect(deDireccion.length).toBeGreaterThan(delInstructor.length);
  });
});
