import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@vonveria-swim/auth";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { importBackup, deleteOrganizationData } from "@vonveria-swim/database/src/import";
import { PrismaService } from "../prisma/prisma.service";
import { BackupService } from "./backup.service";

/**
 * Flujo critico #14 de la Seccion 19: "Restaurar respaldo en un entorno
 * controlado". La Seccion 17 es tajante: un respaldo no vale hasta probar la
 * restauracion, asi que esto se corre en cada suite y no una sola vez a mano.
 *
 * Exporta -> borra la escuela por completo -> importa -> compara.
 */
describe("Respaldo y restauracion de ida y vuelta", () => {
  const prisma = new PrismaService();
  const backupService = new BackupService(prisma);

  let organizationId: string;
  let backup: Record<string, unknown>;

  const CONTRASENA_ORIGINAL = "ContrasenaOriginal123!";
  const CONTRASENA_TRAS_RESTAURAR = "NuevaTrasRestaurar456!";
  let adminEmail: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: {
        name: `Org restauracion ${Date.now()}`,
        defaultEnrollmentFee: "300.00",
        defaultAnnualFee: "800.00",
      },
    });
    organizationId = organization.id;

    await prisma.client.brandingSettings.create({
      data: { organizationId, primaryColor: "#123456", accentColor: "#abcdef" },
    });

    // Rol con capacidades reales: es lo que se rompia sin el catalogo de permisos.
    const permission = await prisma.client.permission.upsert({
      where: { key: CAPABILITIES.STUDENTS_MANAGE },
      update: {},
      create: { key: CAPABILITIES.STUDENTS_MANAGE, description: "Administrar alumnos" },
    });
    const role = await prisma.client.role.create({
      data: {
        organizationId,
        key: "DIRECCION",
        name: "Direccion",
        permissions: { create: { permissionId: permission.id } },
      },
    });

    adminEmail = `admin-restauracion-${Date.now()}@example.com`;
    const admin = await prisma.client.user.create({
      data: {
        organizationId,
        email: adminEmail,
        fullName: "Direccion Original",
        passwordHash: await hashPassword(CONTRASENA_ORIGINAL),
        roles: { create: { roleId: role.id } },
      },
    });

    const branch = await prisma.client.branch.create({
      data: { organizationId, name: "Sucursal Principal" },
    });
    const pool = await prisma.client.pool.create({
      data: { branchId: branch.id, name: "Alberca Grande" },
    });
    const lane = await prisma.client.lane.create({
      data: { poolId: pool.id, name: "Carril 1" },
    });
    const program = await prisma.client.program.create({
      data: { organizationId, name: "Natacion Infantil" },
    });
    const level = await prisma.client.level.create({
      data: { programId: program.id, name: "Nivel 1" },
    });

    const group = await prisma.client.group.create({
      data: {
        organizationId,
        name: "Clase 9-10AM",
        programId: program.id,
        levelId: level.id,
        branchId: branch.id,
        poolId: pool.id,
        laneId: lane.id,
        instructorId: admin.id,
        capacity: 10,
        isPublished: true,
      },
    });
    await prisma.client.scheduleRule.create({
      data: { groupId: group.id, weekDay: "MONDAY", startTime: "09:00", durationMinutes: 60 },
    });
    const session = await prisma.client.classSession.create({
      data: { groupId: group.id, startsAt: new Date(), endsAt: new Date(Date.now() + 3600_000) },
    });

    const family = await prisma.client.family.create({ data: { organizationId } });
    await prisma.client.guardian.create({
      data: { familyId: family.id, fullName: "María Tutora", phone: "5512345678" },
    });
    const student = await prisma.client.student.create({
      data: { organizationId, familyId: family.id, fullName: "Juan García Ñoño" },
    });

    const enrollment = await prisma.client.enrollment.create({
      data: {
        organizationId,
        studentId: student.id,
        groupId: group.id,
        startDate: new Date(),
        billingModality: "MONTHLY",
        monthlyRateAmount: "1500.00",
        monthlyDueDay: 15,
        annualFeeAmount: "800.00",
      },
    });
    const charge = await prisma.client.charge.create({
      data: {
        organizationId,
        studentId: student.id,
        enrollmentId: enrollment.id,
        type: "MONTHLY_FEE",
        description: "Mensualidad 8/2026",
        amount: "1500.00",
        dueDate: new Date(),
      },
    });

    const closing = await prisma.client.cashClosing.create({
      data: {
        organizationId,
        openedAt: new Date(Date.now() - 7200_000),
        totalCash: "1790.00",
        totalTransfer: "0",
        totalCard: "260.00",
        totalOther: "0",
        actorUserId: admin.id,
      },
    });
    const payment = await prisma.client.payment.create({
      data: {
        organizationId,
        studentId: student.id,
        amount: "1500.00",
        method: "CASH",
        cashClosingId: closing.id,
      },
    });
    await prisma.client.paymentAllocation.create({
      data: { paymentId: payment.id, chargeId: charge.id, amount: "1500.00" },
    });

    await prisma.client.attendance.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        status: "ABSENT_JUSTIFIED",
        notes: "Cita medica",
      },
    });

    const product = await prisma.client.product.create({
      data: {
        organizationId,
        name: "Googles",
        category: "EQUIPMENT",
        unitPrice: "250.00",
      },
    });
    await prisma.client.stockMovement.create({
      data: { productId: product.id, delta: 15, reason: "PURCHASE" },
    });
    const sale = await prisma.client.sale.create({
      data: {
        organizationId,
        total: "250.00",
        method: "CARD",
        cashClosingId: closing.id,
      },
    });
    await prisma.client.saleLine.create({
      data: {
        saleId: sale.id,
        productId: product.id,
        quantity: 1,
        unitPrice: "250.00",
        lineTotal: "250.00",
      },
    });
    await prisma.client.stockMovement.create({
      data: { productId: product.id, delta: -1, reason: "SALE", saleId: sale.id },
    });

    await prisma.client.assessment.create({
      data: {
        organizationId,
        studentId: student.id,
        evaluatorUserId: admin.id,
        observation: "Flota sin apoyo y respira de lado.",
        suggestedLevelId: level.id,
      },
    });

    backup = (await backupService.exportAll(organizationId)) as unknown as Record<string, unknown>;

    // El escenario real: la escuela desaparece por completo.
    await deleteOrganizationData(prisma.client, organizationId);

    process.env.ADMIN_EMAIL = adminEmail;
    process.env.ADMIN_PASSWORD = CONTRASENA_TRAS_RESTAURAR;
    await importBackup(prisma.client, backup);
  });

  afterAll(async () => {
    await deleteOrganizationData(prisma.client, organizationId);
    await prisma.onModuleDestroy();
  });

  it("la escuela vuelve a existir con su marca", async () => {
    const organization = await prisma.client.organization.findUnique({
      where: { id: organizationId },
      include: { branding: true },
    });
    expect(organization).not.toBeNull();
    expect(organization?.branding?.primaryColor).toBe("#123456");
    expect(organization?.defaultAnnualFee?.toString()).toBe("800");
    expect(organization?.defaultEnrollmentFee?.toString()).toBe("300");
  });

  it("la inscripcion conserva su anualidad, que es lo que el worker renueva", async () => {
    const enrollment = await prisma.client.enrollment.findFirst({ where: { organizationId } });
    // Sin esto el alumno restaurado dejaba de pagar anualidad para siempre,
    // en silencio: el respaldo se veia completo.
    expect(enrollment?.annualFeeAmount?.toString()).toBe("800");
    expect(enrollment?.monthlyRateAmount?.toString()).toBe("1500");
  });

  it("los alumnos y su familia vuelven con acentos intactos", async () => {
    const students = await prisma.client.student.findMany({ where: { organizationId } });
    expect(students).toHaveLength(1);
    expect(students[0]?.fullName).toBe("Juan García Ñoño");

    const guardians = await prisma.client.guardian.findMany({
      where: { family: { organizationId } },
    });
    expect(guardians[0]?.fullName).toBe("María Tutora");
  });

  it("el grupo conserva su carril y su instructor", async () => {
    const group = await prisma.client.group.findFirst({
      where: { organizationId },
      include: { lane: true, instructor: true, scheduleRules: true },
    });
    expect(group?.lane?.name).toBe("Carril 1");
    expect(group?.instructor?.fullName).toBe("Direccion Original");
    expect(group?.scheduleRules).toHaveLength(1);
  });

  it("la cobranza cuadra: cargo, pago, asignacion y corte", async () => {
    const charge = await prisma.client.charge.findFirst({
      where: { organizationId },
      include: { allocations: true },
    });
    expect(charge?.amount.toString()).toBe("1500");
    expect(charge?.allocations[0]?.amount.toString()).toBe("1500");

    const closing = await prisma.client.cashClosing.findFirst({ where: { organizationId } });
    expect(closing?.totalCash.toString()).toBe("1790");
    expect(closing?.totalCard.toString()).toBe("260");

    const payment = await prisma.client.payment.findFirst({ where: { organizationId } });
    expect(payment?.cashClosingId).toBe(closing?.id);
  });

  it("la tienda conserva existencias y la venta su corte", async () => {
    const movements = await prisma.client.stockMovement.findMany({
      where: { product: { organizationId } },
    });
    expect(movements.reduce((total, movement) => total + movement.delta, 0)).toBe(14);

    const sale = await prisma.client.sale.findFirst({
      where: { organizationId },
      include: { lines: true },
    });
    expect(sale?.total.toString()).toBe("250");
    expect(sale?.lines[0]?.unitPrice.toString()).toBe("250");
    expect(sale?.cashClosingId).not.toBeNull();
  });

  it("asistencia y evaluacion sobreviven", async () => {
    const attendance = await prisma.client.attendance.findFirst({
      where: { student: { organizationId } },
    });
    expect(attendance?.notes).toBe("Cita medica");

    const assessment = await prisma.client.assessment.findFirst({
      where: { organizationId },
      include: { suggestedLevel: true },
    });
    expect(assessment?.suggestedLevel?.name).toBe("Nivel 1");
  });

  it("los roles conservan sus capacidades", async () => {
    const role = await prisma.client.role.findFirst({
      where: { organizationId },
      include: { permissions: { include: { permission: true } } },
    });
    expect(role?.permissions.map((rolePermission) => rolePermission.permission.key)).toContain(
      CAPABILITIES.STUDENTS_MANAGE,
    );
  });

  it("la contrasena anterior ya no sirve y Direccion entra con ADMIN_PASSWORD", async () => {
    const admin = await prisma.client.user.findFirst({
      where: { organizationId, email: adminEmail },
    });
    expect(admin).not.toBeNull();

    expect(await verifyPassword(admin!.passwordHash, CONTRASENA_ORIGINAL)).toBe(false);
    expect(await verifyPassword(admin!.passwordHash, CONTRASENA_TRAS_RESTAURAR)).toBe(true);
  });

  it("importar de nuevo sin --replace se detiene", async () => {
    await expect(importBackup(prisma.client, backup)).rejects.toThrow(/ya existe/i);
  });

  it("con --replace queda exactamente el contenido del archivo, sin duplicar", async () => {
    await prisma.client.student.create({
      data: {
        organizationId,
        familyId: (await prisma.client.family.findFirstOrThrow({ where: { organizationId } })).id,
        fullName: "Alumno agregado despues del respaldo",
      },
    });
    expect(await prisma.client.student.count({ where: { organizationId } })).toBe(2);

    await importBackup(prisma.client, backup, { replace: true });

    const students = await prisma.client.student.findMany({ where: { organizationId } });
    expect(students).toHaveLength(1);
    expect(students[0]?.fullName).toBe("Juan García Ñoño");
  });
});
