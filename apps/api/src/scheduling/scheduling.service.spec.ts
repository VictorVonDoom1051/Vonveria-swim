import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { WeekDay } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { SchedulingService } from "./scheduling.service";

/**
 * Pruebas de integracion: requieren Postgres real (ver src/test-setup.ts).
 * Crean y borran su propia organizacion, no tocan el seed de piloto.
 */
describe("SchedulingService.createGroup", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const schedulingService = new SchedulingService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let instructorId: string;
  let programId: string;
  let levelId: string;
  let branchId: string;
  let poolId: string;
  let laneId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org de prueba scheduling ${Date.now()}` },
    });
    organizationId = organization.id;

    const actor = await prisma.client.user.create({
      data: {
        organizationId,
        email: `actor-scheduling-${Date.now()}@example.com`,
        fullName: "Actor de prueba",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });
    actorUserId = actor.id;

    const instructor = await prisma.client.user.create({
      data: {
        organizationId,
        email: `instructor-${Date.now()}@example.com`,
        fullName: "Instructor de prueba",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });
    instructorId = instructor.id;

    const branch = await prisma.client.branch.create({ data: { organizationId, name: "Sucursal" } });
    const pool = await prisma.client.pool.create({ data: { branchId: branch.id, name: "Alberca" } });
    const lane = await prisma.client.lane.create({ data: { poolId: pool.id, name: "1" } });
    const program = await prisma.client.program.create({ data: { organizationId, name: "Programa" } });
    const level = await prisma.client.level.create({ data: { programId: program.id, name: "Nivel" } });

    branchId = branch.id;
    poolId = pool.id;
    laneId = lane.id;
    programId = program.id;
    levelId = level.id;
  });

  afterAll(async () => {
    await prisma.client.scheduleRule.deleteMany({ where: { group: { organizationId } } });
    await prisma.client.group.deleteMany({ where: { organizationId } });
    await prisma.client.auditLog.deleteMany({ where: { organizationId } });
    await prisma.client.level.deleteMany({ where: { program: { organizationId } } });
    await prisma.client.program.deleteMany({ where: { organizationId } });
    await prisma.client.lane.deleteMany({ where: { pool: { branch: { organizationId } } } });
    await prisma.client.pool.deleteMany({ where: { branch: { organizationId } } });
    await prisma.client.branch.deleteMany({ where: { organizationId } });
    await prisma.client.user.deleteMany({ where: { organizationId } });
    await prisma.client.organization.delete({ where: { id: organizationId } });
    await prisma.onModuleDestroy();
  });

  it("crea un grupo con horario sin conflictos", async () => {
    const group = await schedulingService.createGroup(organizationId, actorUserId, {
      name: "Grupo A",
      programId,
      levelId,
      branchId,
      poolId,
      laneId,
      instructorId,
      capacity: 10,
      scheduleRules: [{ weekDay: WeekDay.MONDAY, startTime: "16:00", durationMinutes: 45 }],
    });

    expect(group.scheduleRules).toHaveLength(1);
  });

  it("rechaza un segundo grupo con el mismo instructor y horario traslapado", async () => {
    await expect(
      schedulingService.createGroup(organizationId, actorUserId, {
        name: "Grupo B (mismo instructor, mismo horario)",
        programId,
        levelId,
        branchId,
        poolId,
        capacity: 5,
        instructorId,
        scheduleRules: [{ weekDay: WeekDay.MONDAY, startTime: "16:15", durationMinutes: 30 }],
      }),
    ).rejects.toThrow();
  });

  it("rechaza un segundo grupo con el mismo carril y horario traslapado", async () => {
    await expect(
      schedulingService.createGroup(organizationId, actorUserId, {
        name: "Grupo C (mismo carril, mismo horario)",
        programId,
        levelId,
        branchId,
        poolId,
        laneId,
        capacity: 5,
        scheduleRules: [{ weekDay: WeekDay.MONDAY, startTime: "16:30", durationMinutes: 30 }],
      }),
    ).rejects.toThrow();
  });

  it("permite un segundo grupo con el mismo instructor en un horario distinto", async () => {
    const group = await schedulingService.createGroup(organizationId, actorUserId, {
      name: "Grupo D (mismo instructor, otro dia)",
      programId,
      levelId,
      branchId,
      poolId,
      instructorId,
      capacity: 5,
      scheduleRules: [{ weekDay: WeekDay.TUESDAY, startTime: "16:00", durationMinutes: 45 }],
    });

    expect(group.scheduleRules[0]?.weekDay).toBe(WeekDay.TUESDAY);
  });
});
