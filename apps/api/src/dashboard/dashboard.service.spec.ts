import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ChargesService } from "../billing/charges.service";
import { DashboardService } from "./dashboard.service";

/**
 * Pruebas de integracion: requieren Postgres real (ver src/test-setup.ts).
 * Crean y borran su propia organizacion, no tocan el seed de piloto.
 */
describe("DashboardService.getToday", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const charges = new ChargesService(prisma, audit);
  const dashboard = new DashboardService(prisma, charges);

  let organizationId: string;
  let otherOrganizationId: string;
  let laneUnoId: string;
  let sessionId: string;
  let studentId: string;

  /** Hoy a una hora fija, para que la prueba no dependa del reloj real. */
  const hoyALas = (hour: number, minute = 0) => {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org panel ${Date.now()}` },
    });
    organizationId = organization.id;

    const otra = await prisma.client.organization.create({
      data: { name: `Org ajena panel ${Date.now()}` },
    });
    otherOrganizationId = otra.id;

    const instructor = await prisma.client.user.create({
      data: {
        organizationId,
        email: `panel-${Date.now()}@example.com`,
        fullName: "Maestra Prueba",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });

    const branch = await prisma.client.branch.create({
      data: { organizationId, name: "Sucursal" },
    });
    const grande = await prisma.client.pool.create({
      data: { branchId: branch.id, name: "Alberca Grande" },
    });
    await prisma.client.pool.create({ data: { branchId: branch.id, name: "Alberca Chica" } });

    const laneUno = await prisma.client.lane.create({
      data: { poolId: grande.id, name: "Carril 1" },
    });
    laneUnoId = laneUno.id;
    await prisma.client.lane.create({ data: { poolId: grande.id, name: "Carril 2" } });

    const program = await prisma.client.program.create({
      data: { organizationId, name: "Programa" },
    });
    const level = await prisma.client.level.create({
      data: { programId: program.id, name: "Nivel" },
    });
    const group = await prisma.client.group.create({
      data: {
        organizationId,
        name: "Clase de prueba",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: grande.id,
        laneId: laneUno.id,
        instructorId: instructor.id,
        capacity: 10,
      },
    });

    const session = await prisma.client.classSession.create({
      data: { groupId: group.id, startsAt: hoyALas(9), endsAt: hoyALas(10) },
    });
    sessionId = session.id;

    const family = await prisma.client.family.create({ data: { organizationId } });
    const student = await prisma.client.student.create({
      data: { organizationId, familyId: family.id, fullName: "Alumno Panel" },
    });
    studentId = student.id;
  });

  afterAll(async () => {
    const ids = [organizationId, otherOrganizationId];
    await prisma.client.attendance.deleteMany({
      where: { student: { organizationId: { in: ids } } },
    });
    await prisma.client.classSession.deleteMany({
      where: { group: { organizationId: { in: ids } } },
    });
    await prisma.client.charge.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.group.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.student.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.family.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.lane.deleteMany({
      where: { pool: { branch: { organizationId: { in: ids } } } },
    });
    await prisma.client.pool.deleteMany({ where: { branch: { organizationId: { in: ids } } } });
    await prisma.client.branch.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.level.deleteMany({ where: { program: { organizationId: { in: ids } } } });
    await prisma.client.program.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.auditLog.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.user.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.organization.deleteMany({ where: { id: { in: ids } } });
    await prisma.onModuleDestroy();
  });

  it("arma las albercas con sus carriles y marca el ocupado durante la clase", async () => {
    const panel = await dashboard.getToday(organizationId, true, hoyALas(9, 30));

    const grande = panel.pools.find((pool) => pool.name === "Alberca Grande");
    expect(grande?.lanes).toHaveLength(2);

    const carrilUno = grande?.lanes.find((lane) => lane.id === laneUnoId);
    expect(carrilUno?.current?.group.name).toBe("Clase de prueba");
    expect(carrilUno?.current?.group.instructor?.fullName).toBe("Maestra Prueba");

    const carrilDos = grande?.lanes.find((lane) => lane.id !== laneUnoId);
    expect(carrilDos?.current).toBeNull();
  });

  it("fuera de horario el carril esta libre y anuncia cuando se ocupa", async () => {
    const panel = await dashboard.getToday(organizationId, true, hoyALas(7));
    const carrilUno = panel.pools
      .flatMap((pool) => pool.lanes)
      .find((lane) => lane.id === laneUnoId);

    expect(carrilUno?.current).toBeNull();
    expect(carrilUno?.next?.group.name).toBe("Clase de prueba");
  });

  it("la alberca sin carriles se reporta como un solo espacio", async () => {
    const panel = await dashboard.getToday(organizationId, true, hoyALas(9, 30));
    const chica = panel.pools.find((pool) => pool.name === "Alberca Chica");

    expect(chica?.lanes).toHaveLength(0);
    expect(chica?.poolLevel.current).toBeNull();
  });

  it("muestra los cargos vencidos y no los que aun no vencen", async () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 3);
    const enUnaSemana = new Date();
    enUnaSemana.setDate(enUnaSemana.getDate() + 7);

    await prisma.client.charge.create({
      data: {
        organizationId,
        studentId,
        type: "OTHER",
        description: "Cargo vencido",
        amount: "500.00",
        dueDate: ayer,
      },
    });
    await prisma.client.charge.create({
      data: {
        organizationId,
        studentId,
        type: "OTHER",
        description: "Cargo al corriente",
        amount: "300.00",
        dueDate: enUnaSemana,
      },
    });

    const panel = await dashboard.getToday(organizationId, true, hoyALas(12));
    const descripciones = panel.overdueCharges.map((charge) => charge.description);

    expect(descripciones).toContain("Cargo vencido");
    expect(descripciones).not.toContain("Cargo al corriente");
  });

  it("sin billing:manage no se devuelve informacion de cobranza", async () => {
    const panel = await dashboard.getToday(organizationId, false, hoyALas(12));
    expect(panel.overdueCharges).toHaveLength(0);
  });

  it("lista las faltas avisadas de hoy", async () => {
    await prisma.client.attendance.create({
      data: {
        sessionId,
        studentId,
        status: "ABSENT_JUSTIFIED",
        notes: "Cita medica",
      },
    });

    const panel = await dashboard.getToday(organizationId, true, hoyALas(12));
    expect(panel.todayAbsences).toHaveLength(1);
    expect(panel.todayAbsences[0]?.student.fullName).toBe("Alumno Panel");
    expect(panel.todayAbsences[0]?.notes).toBe("Cita medica");
  });

  it("no filtra albercas de otra organizacion", async () => {
    const panel = await dashboard.getToday(otherOrganizationId, true, hoyALas(9, 30));
    expect(panel.pools).toHaveLength(0);
    expect(panel.overdueCharges).toHaveLength(0);
    expect(panel.todayAbsences).toHaveLength(0);
  });
});
