import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { EnrollmentsService } from "./enrollments.service";

/**
 * Pruebas de integracion: requieren Postgres real (ver src/test-setup.ts).
 * Crean y borran su propia organizacion, no tocan el seed de piloto.
 */
describe("EnrollmentsService.createEnrollment", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const enrollmentsService = new EnrollmentsService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let groupId: string;
  let studentAId: string;
  let studentBId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org de prueba enrollments ${Date.now()}` },
    });
    organizationId = organization.id;

    const actor = await prisma.client.user.create({
      data: {
        organizationId,
        email: `actor-${Date.now()}@example.com`,
        fullName: "Actor de prueba",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });
    actorUserId = actor.id;

    const branch = await prisma.client.branch.create({ data: { organizationId, name: "Sucursal" } });
    const pool = await prisma.client.pool.create({ data: { branchId: branch.id, name: "Alberca" } });
    const program = await prisma.client.program.create({ data: { organizationId, name: "Programa" } });
    const level = await prisma.client.level.create({ data: { programId: program.id, name: "Nivel" } });

    const group = await prisma.client.group.create({
      data: {
        organizationId,
        name: "Grupo capacidad 1",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        capacity: 1,
      },
    });
    groupId = group.id;

    const family = await prisma.client.family.create({ data: { organizationId } });
    const studentA = await prisma.client.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno A" },
    });
    const studentB = await prisma.client.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno B" },
    });
    studentAId = studentA.id;
    studentBId = studentB.id;
  });

  afterAll(async () => {
    await prisma.client.enrollmentStatusHistory.deleteMany({
      where: { enrollment: { organizationId } },
    });
    await prisma.client.enrollment.deleteMany({ where: { organizationId } });
    await prisma.client.auditLog.deleteMany({ where: { organizationId } });
    await prisma.client.student.deleteMany({ where: { organizationId } });
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

  it("inscribe exitosamente cuando hay cupo", async () => {
    const enrollment = await enrollmentsService.createEnrollment(organizationId, actorUserId, {
      studentId: studentAId,
      groupId,
      startDate: "2026-09-01",
    });
    expect(enrollment.status).toBe("ACTIVE");
  });

  it("rechaza una segunda inscripcion cuando el grupo ya esta lleno", async () => {
    await expect(
      enrollmentsService.createEnrollment(organizationId, actorUserId, {
        studentId: studentBId,
        groupId,
        startDate: "2026-09-01",
      }),
    ).rejects.toThrow();
  });

  it("rechaza inscribir dos veces al mismo alumno en el mismo grupo", async () => {
    await expect(
      enrollmentsService.createEnrollment(organizationId, actorUserId, {
        studentId: studentAId,
        groupId,
        startDate: "2026-09-01",
      }),
    ).rejects.toThrow();
  });
});

describe("EnrollmentsService.createEnrollment concurrencia", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const enrollmentsService = new EnrollmentsService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let groupId: string;
  let studentAId: string;
  let studentBId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org de prueba concurrencia ${Date.now()}` },
    });
    organizationId = organization.id;

    const actor = await prisma.client.user.create({
      data: {
        organizationId,
        email: `actor-concurrency-${Date.now()}@example.com`,
        fullName: "Actor de prueba",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });
    actorUserId = actor.id;

    const branch = await prisma.client.branch.create({ data: { organizationId, name: "Sucursal" } });
    const pool = await prisma.client.pool.create({ data: { branchId: branch.id, name: "Alberca" } });
    const program = await prisma.client.program.create({ data: { organizationId, name: "Programa" } });
    const level = await prisma.client.level.create({ data: { programId: program.id, name: "Nivel" } });

    const group = await prisma.client.group.create({
      data: {
        organizationId,
        name: "Grupo ultimo cupo",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        capacity: 1,
      },
    });
    groupId = group.id;

    const family = await prisma.client.family.create({ data: { organizationId } });
    const studentA = await prisma.client.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno A" },
    });
    const studentB = await prisma.client.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno B" },
    });
    studentAId = studentA.id;
    studentBId = studentB.id;
  });

  afterAll(async () => {
    await prisma.client.enrollmentStatusHistory.deleteMany({
      where: { enrollment: { organizationId } },
    });
    await prisma.client.enrollment.deleteMany({ where: { organizationId } });
    await prisma.client.auditLog.deleteMany({ where: { organizationId } });
    await prisma.client.student.deleteMany({ where: { organizationId } });
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

  it("solo una de dos inscripciones simultaneas al ultimo cupo tiene exito (Seccion 13 y 19)", async () => {
    const results = await Promise.allSettled([
      enrollmentsService.createEnrollment(organizationId, actorUserId, {
        studentId: studentAId,
        groupId,
        startDate: "2026-09-01",
      }),
      enrollmentsService.createEnrollment(organizationId, actorUserId, {
        studentId: studentBId,
        groupId,
        startDate: "2026-09-01",
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const activeCount = await prisma.client.enrollment.count({ where: { groupId, status: "ACTIVE" } });
    expect(activeCount).toBe(1);
  });
});
