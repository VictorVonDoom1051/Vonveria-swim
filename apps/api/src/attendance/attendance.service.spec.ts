import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AttendanceService } from "./attendance.service";

/**
 * Pruebas de integracion: requieren Postgres real (ver src/test-setup.ts).
 * Crean y borran su propia organizacion, no tocan el seed de piloto.
 */
describe("AttendanceService", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const attendance = new AttendanceService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let sessionId: string;
  let studentId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org asistencia ${Date.now()}` },
    });
    organizationId = organization.id;

    const actor = await prisma.client.user.create({
      data: {
        organizationId,
        email: `asistencia-${Date.now()}@example.com`,
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
        name: "Grupo",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        capacity: 10,
      },
    });
    const session = await prisma.client.classSession.create({
      data: { groupId: group.id, startsAt: new Date(), endsAt: new Date(Date.now() + 3600_000) },
    });
    sessionId = session.id;

    const family = await prisma.client.family.create({ data: { organizationId } });
    const student = await prisma.client.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno" },
    });
    studentId = student.id;
  });

  afterAll(async () => {
    await prisma.client.attendance.deleteMany({ where: { student: { organizationId } } });
    await prisma.client.classSession.deleteMany({ where: { group: { organizationId } } });
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

  it("marca la falta con su nota", async () => {
    const marcada = await attendance.markAbsent(
      organizationId,
      sessionId,
      studentId,
      "No hay quien lo lleve a clase",
      actorUserId,
    );

    expect(marcada.status).toBe("ABSENT_JUSTIFIED");
    expect(marcada.notes).toBe("No hay quien lo lleve a clase");
  });

  it("al revertir limpia la nota, que ya no aplica", async () => {
    await attendance.markAbsent(
      organizationId,
      sessionId,
      studentId,
      "No hay quien lo lleve a clase",
      actorUserId,
    );

    const revertida = await attendance.markPresent(
      organizationId,
      sessionId,
      studentId,
      actorUserId,
    );

    expect(revertida.status).toBe("PRESENT");
    // Sin esto quedaban registros diciendo "Presente" con el motivo de una
    // ausencia que ya se deshizo, y asi salian en el CSV impreso.
    expect(revertida.notes).toBeNull();
  });
});
