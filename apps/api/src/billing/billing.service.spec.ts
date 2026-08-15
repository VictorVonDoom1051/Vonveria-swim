import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ChargesService } from "./charges.service";
import { PaymentsService } from "./payments.service";
import { AdjustmentsService } from "./adjustments.service";
import { RefundsService } from "./refunds.service";
import { PackagesService } from "./packages.service";
import { CashClosingService } from "./cash-closing.service";

/**
 * Pruebas de integracion: requieren Postgres real (ver src/test-setup.ts).
 * Cada describe crea y borra su propia organizacion, no toca el seed de piloto.
 */
async function createTestOrg(prisma: PrismaService, label: string) {
  const organization = await prisma.client.organization.create({
    data: { name: `Org de prueba ${label} ${Date.now()}-${Math.random()}` },
  });
  const actor = await prisma.client.user.create({
    data: {
      organizationId: organization.id,
      email: `actor-${label}-${Date.now()}-${Math.random()}@example.com`,
      fullName: "Actor de prueba",
      passwordHash: await hashPassword("ClaveDePrueba123!"),
    },
  });
  const family = await prisma.client.family.create({ data: { organizationId: organization.id } });
  const student = await prisma.client.student.create({
    data: { organizationId: organization.id, familyId: family.id, fullName: `Alumno ${label}` },
  });

  return { organizationId: organization.id, actorUserId: actor.id, studentId: student.id };
}

async function cleanupTestOrg(prisma: PrismaService, organizationId: string) {
  await prisma.client.packageCreditMovement.deleteMany({
    where: { packageCredit: { organizationId } },
  });
  await prisma.client.packageCredit.deleteMany({ where: { organizationId } });
  await prisma.client.refund.deleteMany({ where: { payment: { organizationId } } });
  await prisma.client.paymentAllocation.deleteMany({ where: { payment: { organizationId } } });
  await prisma.client.adjustment.deleteMany({ where: { charge: { organizationId } } });
  await prisma.client.payment.deleteMany({ where: { organizationId } });
  await prisma.client.charge.deleteMany({ where: { organizationId } });
  await prisma.client.cashClosing.deleteMany({ where: { organizationId } });
  await prisma.client.auditLog.deleteMany({ where: { organizationId } });
  await prisma.client.student.deleteMany({ where: { organizationId } });
  await prisma.client.family.deleteMany({ where: { organizationId } });
  await prisma.client.user.deleteMany({ where: { organizationId } });
  await prisma.client.organization.delete({ where: { id: organizationId } });
}

describe("PaymentsService.createPayment — asignacion automatica", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const chargesService = new ChargesService(prisma, audit);
  const paymentsService = new PaymentsService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let studentId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const ctx = await createTestOrg(prisma, "payments");
    organizationId = ctx.organizationId;
    actorUserId = ctx.actorUserId;
    studentId = ctx.studentId;

    await chargesService.createManualCharge(organizationId, actorUserId, {
      studentId,
      type: "SINGLE_CLASS",
      description: "Cargo 1 (300)",
      amount: "300.00",
    });
    await chargesService.createManualCharge(organizationId, actorUserId, {
      studentId,
      type: "SINGLE_CLASS",
      description: "Cargo 2 (200)",
      amount: "200.00",
    });
  });

  afterAll(async () => {
    await cleanupTestOrg(prisma, organizationId);
    await prisma.onModuleDestroy();
  });

  it("un pago parcial deja el cargo mas antiguo en PARTIALLY_PAID", async () => {
    await paymentsService.createPayment(organizationId, actorUserId, {
      studentId,
      amount: "150.00",
      method: "CASH",
    });

    const charges = await chargesService.listForStudent(organizationId, studentId);
    const [charge1, charge2] = charges;
    expect(charge1?.status).toBe("PARTIALLY_PAID");
    expect(charge1?.balance.toNumber()).toBe(150);
    expect(charge2?.status).toBe("PENDING");
  });

  it("un segundo pago completa el primer cargo y paga el segundo por completo", async () => {
    await paymentsService.createPayment(organizationId, actorUserId, {
      studentId,
      amount: "350.00",
      method: "TRANSFER",
    });

    const charges = await chargesService.listForStudent(organizationId, studentId);
    for (const charge of charges) {
      expect(charge.status).toBe("PAID");
      expect(charge.balance.toNumber()).toBe(0);
    }
  });

  it("un pago que excede lo debido no sobre-asigna (queda sobrante sin aplicar)", async () => {
    const charge = await chargesService.createManualCharge(organizationId, actorUserId, {
      studentId,
      type: "OTHER",
      description: "Cargo excedente (100)",
      amount: "100.00",
    });

    await paymentsService.createPayment(organizationId, actorUserId, {
      studentId,
      amount: "150.00",
      method: "CASH",
    });

    const updated = await prisma.client.charge.findUniqueOrThrow({
      where: { id: charge.id },
      include: { allocations: true },
    });
    const allocatedTotal = updated.allocations.reduce((sum, allocation) => sum + allocation.amount.toNumber(), 0);
    expect(allocatedTotal).toBe(100);
    expect(updated.status).toBe("PAID");
  });
});

describe("PaymentsService.createPayment — concurrencia", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const chargesService = new ChargesService(prisma, audit);
  const paymentsService = new PaymentsService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let studentId: string;
  let chargeId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const ctx = await createTestOrg(prisma, "concurrencia");
    organizationId = ctx.organizationId;
    actorUserId = ctx.actorUserId;
    studentId = ctx.studentId;

    const charge = await chargesService.createManualCharge(organizationId, actorUserId, {
      studentId,
      type: "SINGLE_CLASS",
      description: "Cargo unico (500)",
      amount: "500.00",
    });
    chargeId = charge.id;
  });

  afterAll(async () => {
    await cleanupTestOrg(prisma, organizationId);
    await prisma.onModuleDestroy();
  });

  it("dos pagos simultaneos sobre el mismo cargo no asignan mas de lo debido", async () => {
    await Promise.all([
      paymentsService.createPayment(organizationId, actorUserId, { studentId, amount: "300.00", method: "CASH" }),
      paymentsService.createPayment(organizationId, actorUserId, { studentId, amount: "300.00", method: "CASH" }),
    ]);

    const charge = await prisma.client.charge.findUniqueOrThrow({
      where: { id: chargeId },
      include: { allocations: true },
    });
    const allocatedTotal = charge.allocations.reduce((sum, allocation) => sum + allocation.amount.toNumber(), 0);
    expect(allocatedTotal).toBe(500);
    expect(charge.status).toBe("PAID");
  });
});

describe("PackagesService — venta y consumo", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const packagesService = new PackagesService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let studentId: string;
  let packageCreditId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const ctx = await createTestOrg(prisma, "paquetes");
    organizationId = ctx.organizationId;
    actorUserId = ctx.actorUserId;
    studentId = ctx.studentId;

    const credit = await packagesService.sellPackage(organizationId, actorUserId, {
      studentId,
      totalUnits: 8,
      validDays: 30,
      amount: "1000.00",
    });
    packageCreditId = credit.id;
  });

  afterAll(async () => {
    await cleanupTestOrg(prisma, organizationId);
    await prisma.onModuleDestroy();
  });

  it("consumir unidades reduce el saldo restante", async () => {
    await packagesService.consumeUnit(organizationId, actorUserId, packageCreditId, {});
    await packagesService.consumeUnit(organizationId, actorUserId, packageCreditId, {});

    const [credit] = await packagesService.listForStudent(organizationId, studentId);
    expect(credit?.remainingUnits).toBe(6);
  });

  it("devolver una unidad regresa el saldo", async () => {
    await packagesService.returnUnit(organizationId, actorUserId, packageCreditId, {});

    const [credit] = await packagesService.listForStudent(organizationId, studentId);
    expect(credit?.remainingUnits).toBe(7);
  });

  it("no permite consumir mas unidades de las disponibles", async () => {
    for (let i = 0; i < 7; i += 1) {
      await packagesService.consumeUnit(organizationId, actorUserId, packageCreditId, {});
    }
    await expect(
      packagesService.consumeUnit(organizationId, actorUserId, packageCreditId, {}),
    ).rejects.toThrow();
  });

  it("no permite devolver mas unidades del total del paquete", async () => {
    for (let i = 0; i < 8; i += 1) {
      await packagesService.returnUnit(organizationId, actorUserId, packageCreditId, {});
    }
    const [creditAtTotal] = await packagesService.listForStudent(organizationId, studentId);
    expect(creditAtTotal?.remainingUnits).toBe(8);

    await expect(
      packagesService.returnUnit(organizationId, actorUserId, packageCreditId, {}),
    ).rejects.toThrow();
  });
});

describe("AdjustmentsService y RefundsService", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const chargesService = new ChargesService(prisma, audit);
  const paymentsService = new PaymentsService(prisma, audit);
  const adjustmentsService = new AdjustmentsService(prisma, audit);
  const refundsService = new RefundsService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let studentId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const ctx = await createTestOrg(prisma, "ajustes");
    organizationId = ctx.organizationId;
    actorUserId = ctx.actorUserId;
    studentId = ctx.studentId;
  });

  afterAll(async () => {
    await cleanupTestOrg(prisma, organizationId);
    await prisma.onModuleDestroy();
  });

  it("un descuento reduce el saldo del cargo sin modificar el monto original", async () => {
    const charge = await chargesService.createManualCharge(organizationId, actorUserId, {
      studentId,
      type: "OTHER",
      description: "Cargo con descuento",
      amount: "400.00",
    });

    await adjustmentsService.createAdjustment(organizationId, actorUserId, {
      chargeId: charge.id,
      amount: "-100.00",
      reason: "Beca parcial",
    });

    const [updated] = await chargesService.listForStudent(organizationId, studentId);
    expect(updated?.amount.toNumber()).toBe(400);
    expect(updated?.balance.toNumber()).toBe(300);
  });

  it("una devolucion no puede exceder el monto del pago", async () => {
    const charge = await chargesService.createManualCharge(organizationId, actorUserId, {
      studentId,
      type: "OTHER",
      description: "Cargo para devolucion",
      amount: "300.00",
    });
    const payment = await paymentsService.createPayment(organizationId, actorUserId, {
      studentId,
      amount: "300.00",
      method: "CARD",
    });
    void charge;

    await refundsService.createRefund(organizationId, actorUserId, {
      paymentId: payment.id,
      amount: "100.00",
      reason: "Devolucion parcial",
    });

    await expect(
      refundsService.createRefund(organizationId, actorUserId, {
        paymentId: payment.id,
        amount: "250.00",
        reason: "Excede lo pagado",
      }),
    ).rejects.toThrow();
  });
});

describe("ChargesService.cancelCharge", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const chargesService = new ChargesService(prisma, audit);
  const paymentsService = new PaymentsService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let studentId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const ctx = await createTestOrg(prisma, "cancelacion");
    organizationId = ctx.organizationId;
    actorUserId = ctx.actorUserId;
    studentId = ctx.studentId;
  });

  afterAll(async () => {
    await cleanupTestOrg(prisma, organizationId);
    await prisma.onModuleDestroy();
  });

  it("cancela un cargo sin pagos aplicados", async () => {
    const charge = await chargesService.createManualCharge(organizationId, actorUserId, {
      studentId,
      type: "OTHER",
      description: "Cargo cancelable",
      amount: "150.00",
    });

    const cancelled = await chargesService.cancelCharge(organizationId, actorUserId, charge.id);
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("rechaza cancelar un cargo que ya tiene pagos aplicados", async () => {
    const charge = await chargesService.createManualCharge(organizationId, actorUserId, {
      studentId,
      type: "OTHER",
      description: "Cargo con pago",
      amount: "150.00",
    });
    await paymentsService.createPayment(organizationId, actorUserId, {
      studentId,
      amount: "150.00",
      method: "CASH",
    });

    await expect(chargesService.cancelCharge(organizationId, actorUserId, charge.id)).rejects.toThrow();
  });
});

describe("CashClosingService.closeCash", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const chargesService = new ChargesService(prisma, audit);
  const paymentsService = new PaymentsService(prisma, audit);
  const cashClosingService = new CashClosingService(prisma, audit);

  let organizationId: string;
  let actorUserId: string;
  let studentId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const ctx = await createTestOrg(prisma, "corte");
    organizationId = ctx.organizationId;
    actorUserId = ctx.actorUserId;
    studentId = ctx.studentId;

    await chargesService.createManualCharge(organizationId, actorUserId, {
      studentId,
      type: "OTHER",
      description: "Cargo efectivo",
      amount: "100.00",
    });
    await chargesService.createManualCharge(organizationId, actorUserId, {
      studentId,
      type: "OTHER",
      description: "Cargo transferencia",
      amount: "200.00",
    });
    await paymentsService.createPayment(organizationId, actorUserId, { studentId, amount: "100.00", method: "CASH" });
    await paymentsService.createPayment(organizationId, actorUserId, {
      studentId,
      amount: "200.00",
      method: "TRANSFER",
    });
  });

  afterAll(async () => {
    await cleanupTestOrg(prisma, organizationId);
    await prisma.onModuleDestroy();
  });

  it("agrupa los pagos abiertos por metodo de pago", async () => {
    const closing = await cashClosingService.closeCash(organizationId, actorUserId);
    expect(closing.totalCash.toNumber()).toBe(100);
    expect(closing.totalTransfer.toNumber()).toBe(200);
  });

  it("rechaza un segundo corte sin pagos nuevos", async () => {
    await expect(cashClosingService.closeCash(organizationId, actorUserId)).rejects.toThrow();
  });
});

describe("Aislamiento por organizacion", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const chargesService = new ChargesService(prisma, audit);

  let orgAId: string;
  let orgBId: string;
  let actorAId: string;
  let studentAId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const ctxA = await createTestOrg(prisma, "aislamiento-a");
    const ctxB = await createTestOrg(prisma, "aislamiento-b");
    orgAId = ctxA.organizationId;
    orgBId = ctxB.organizationId;
    actorAId = ctxA.actorUserId;
    studentAId = ctxA.studentId;

    await chargesService.createManualCharge(orgAId, actorAId, {
      studentId: studentAId,
      type: "OTHER",
      description: "Cargo exclusivo de org A",
      amount: "500.00",
    });
  });

  afterAll(async () => {
    await cleanupTestOrg(prisma, orgAId);
    await cleanupTestOrg(prisma, orgBId);
    await prisma.onModuleDestroy();
  });

  it("los cargos pendientes de una organizacion no aparecen en otra", async () => {
    const pendingA = await chargesService.listPending(orgAId);
    const pendingB = await chargesService.listPending(orgBId);

    expect(pendingA.length).toBeGreaterThan(0);
    expect(pendingB).toHaveLength(0);
  });
});
