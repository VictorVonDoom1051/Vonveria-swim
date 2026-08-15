import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@vonveria-swim/auth";
import { PaymentMethod, ProductCategory, StockMovementReason } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CashClosingService } from "../billing/cash-closing.service";
import { SalesService } from "./sales.service";
import { ProductsService } from "./products.service";
import { StockService } from "./stock.service";

/**
 * Pruebas de integracion: requieren Postgres real (ver src/test-setup.ts).
 * Crean y borran su propia organizacion, no tocan el seed de piloto.
 */
describe("Ventas de mostrador e inventario", () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const productsService = new ProductsService(prisma, audit);
  const stockService = new StockService(prisma, audit, productsService);
  const salesService = new SalesService(prisma, audit);
  const cashClosingService = new CashClosingService(prisma, audit);

  let organizationId: string;
  let otherOrganizationId: string;
  let actorUserId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();

    const organization = await prisma.client.organization.create({
      data: { name: `Org de prueba ventas ${Date.now()}` },
    });
    organizationId = organization.id;

    const otherOrganization = await prisma.client.organization.create({
      data: { name: `Org ajena ventas ${Date.now()}` },
    });
    otherOrganizationId = otherOrganization.id;

    const actor = await prisma.client.user.create({
      data: {
        organizationId,
        email: `actor-ventas-${Date.now()}@example.com`,
        fullName: "Actor de prueba",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });
    actorUserId = actor.id;
  });

  const createdOrganizationIds: string[] = [];

  /** Organizacion aislada para las pruebas que dependen de totales exactos. */
  async function createIsolatedOrganization() {
    const organization = await prisma.client.organization.create({
      data: { name: `Org aislada ventas ${Date.now()}${Math.random()}` },
    });
    createdOrganizationIds.push(organization.id);

    const actor = await prisma.client.user.create({
      data: {
        organizationId: organization.id,
        email: `actor-${Date.now()}${Math.random()}@example.com`,
        fullName: "Actor",
        passwordHash: await hashPassword("ClaveDePrueba123!"),
      },
    });

    return { organizationId: organization.id, actorUserId: actor.id };
  }

  afterAll(async () => {
    const ids = [organizationId, otherOrganizationId, ...createdOrganizationIds];
    // Las llaves foraneas de products/sales son RESTRICT, asi que hay que
    // borrar en orden en vez de confiar en cascada desde la organizacion.
    await prisma.client.saleLine.deleteMany({ where: { sale: { organizationId: { in: ids } } } });
    await prisma.client.stockMovement.deleteMany({
      where: { product: { organizationId: { in: ids } } },
    });
    await prisma.client.sale.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.product.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.payment.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.cashClosing.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.student.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.family.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.auditLog.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.user.deleteMany({ where: { organizationId: { in: ids } } });
    await prisma.client.organization.deleteMany({ where: { id: { in: ids } } });
    await prisma.onModuleDestroy();
  });

  async function createProduct(name: string, unitPrice: string, initialStock: number) {
    return productsService.create(organizationId, actorUserId, {
      name: `${name} ${Date.now()}${Math.random()}`,
      category: ProductCategory.EQUIPMENT,
      unitPrice,
      initialStock,
    });
  }

  it("la venta descuenta existencias y guarda el precio del momento", async () => {
    const product = await createProduct("Googles", "250.00", 10);

    const sale = await salesService.createSale(organizationId, actorUserId, {
      lines: [{ productId: product.id, quantity: 2 }],
      method: PaymentMethod.CASH,
    });

    expect(sale.total.toString()).toBe("500");
    expect(await stockService.getStockOnHand(product.id)).toBe(8);

    // Subir el precio no debe alterar el total de la venta ya hecha.
    await productsService.update(organizationId, actorUserId, product.id, {
      unitPrice: "400.00",
    });
    const stored = await salesService.getById(organizationId, sale.id);
    expect(stored.total.toString()).toBe("500");
    expect(stored.lines[0]?.unitPrice.toString()).toBe("250");
  });

  it("rechaza la venta si no alcanzan las existencias y no descuenta nada", async () => {
    const product = await createProduct("Gorro", "120.00", 1);

    await expect(
      salesService.createSale(organizationId, actorUserId, {
        lines: [{ productId: product.id, quantity: 3 }],
        method: PaymentMethod.CASH,
      }),
    ).rejects.toMatchObject({ response: { errorCode: "INSUFFICIENT_STOCK" } });

    expect(await stockService.getStockOnHand(product.id)).toBe(1);
  });

  it("suma las cantidades cuando el mismo producto viene en dos renglones", async () => {
    const product = await createProduct("Dulce", "10.00", 5);

    await expect(
      salesService.createSale(organizationId, actorUserId, {
        lines: [
          { productId: product.id, quantity: 3 },
          { productId: product.id, quantity: 4 },
        ],
        method: PaymentMethod.CASH,
      }),
    ).rejects.toMatchObject({ response: { errorCode: "INSUFFICIENT_STOCK" } });
  });

  it("dos ventas simultaneas del ultimo articulo: solo una pasa", async () => {
    const product = await createProduct("Ultimo googles", "300.00", 1);

    const results = await Promise.allSettled([
      salesService.createSale(organizationId, actorUserId, {
        lines: [{ productId: product.id, quantity: 1 }],
        method: PaymentMethod.CASH,
      }),
      salesService.createSale(organizationId, actorUserId, {
        lines: [{ productId: product.id, quantity: 1 }],
        method: PaymentMethod.CARD,
      }),
    ]);

    const exitosas = results.filter((result) => result.status === "fulfilled");
    expect(exitosas).toHaveLength(1);
    expect(await stockService.getStockOnHand(product.id)).toBe(0);
  });

  it("no vende un producto de otra organizacion", async () => {
    const ajeno = await prisma.client.product.create({
      data: {
        organizationId: otherOrganizationId,
        name: `Producto ajeno ${Date.now()}`,
        category: ProductCategory.CONSUMABLE,
        unitPrice: "15.00",
      },
    });

    await expect(
      salesService.createSale(organizationId, actorUserId, {
        lines: [{ productId: ajeno.id, quantity: 1 }],
        method: PaymentMethod.CASH,
      }),
    ).rejects.toMatchObject({ response: { errorCode: "PRODUCT_NOT_FOUND" } });
  });

  it("un ajuste de inventario exige motivo", async () => {
    const product = await createProduct("Agua", "20.00", 10);

    await expect(
      stockService.registerMovement(organizationId, actorUserId, product.id, {
        delta: -2,
        reason: StockMovementReason.ADJUSTMENT,
      }),
    ).rejects.toMatchObject({ response: { errorCode: "STOCK_ADJUSTMENT_REQUIRES_NOTES" } });

    const { stockOnHand } = await stockService.registerMovement(
      organizationId,
      actorUserId,
      product.id,
      { delta: -2, reason: StockMovementReason.ADJUSTMENT, notes: "Merma por caducidad" },
    );
    expect(stockOnHand).toBe(8);
  });

  it("el corte de caja cierra aunque solo haya ventas y ningun pago", async () => {
    const org = await createIsolatedOrganization();

    const product = await productsService.create(org.organizationId, org.actorUserId, {
      name: "Toalla",
      category: ProductCategory.EQUIPMENT,
      unitPrice: "200.00",
      initialStock: 4,
    });

    await salesService.createSale(org.organizationId, org.actorUserId, {
      lines: [{ productId: product.id, quantity: 2 }],
      method: PaymentMethod.CASH,
    });

    const resumen = await cashClosingService.getOpenSummary(org.organizationId);
    expect(resumen.totals.CASH.toString()).toBe("400");
    expect(resumen.saleTotals.CASH.toString()).toBe("400");
    expect(resumen.paymentTotals.CASH.toString()).toBe("0");
    expect(resumen.sales).toHaveLength(1);

    // Antes de M7 esto lanzaba CASH_CLOSING_NO_OPEN_PAYMENTS: un dia de solo
    // ventas de productos no se podia cerrar.
    const corte = await cashClosingService.closeCash(org.organizationId, org.actorUserId);
    expect(corte.totalCash.toString()).toBe("400");

    const despues = await cashClosingService.getOpenSummary(org.organizationId);
    expect(despues.sales).toHaveLength(0);

    const detalle = await cashClosingService.getClosingDetail(org.organizationId, corte.id);
    expect(detalle.sales).toHaveLength(1);
  });

  it("el corte suma colegiaturas y productos en un solo total por metodo", async () => {
    const org = await createIsolatedOrganization();

    const family = await prisma.client.family.create({
      data: { organizationId: org.organizationId },
    });
    const student = await prisma.client.student.create({
      data: { organizationId: org.organizationId, familyId: family.id, fullName: "Alumna" },
    });
    await prisma.client.payment.create({
      data: {
        organizationId: org.organizationId,
        studentId: student.id,
        amount: "1500.00",
        method: PaymentMethod.CASH,
      },
    });

    const product = await productsService.create(org.organizationId, org.actorUserId, {
      name: "Gorro",
      category: ProductCategory.EQUIPMENT,
      unitPrice: "120.00",
      initialStock: 3,
    });
    await salesService.createSale(org.organizationId, org.actorUserId, {
      lines: [{ productId: product.id, quantity: 1 }],
      method: PaymentMethod.CASH,
    });

    const corte = await cashClosingService.closeCash(org.organizationId, org.actorUserId);
    expect(corte.totalCash.toString()).toBe("1620");
  });
});
