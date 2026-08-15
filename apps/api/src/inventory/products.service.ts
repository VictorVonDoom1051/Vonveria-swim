import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, StockMovementReason } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * Productos con sus existencias calculadas. onlyActive lo usa el mostrador,
   * que no debe ofrecer productos dados de baja.
   */
  async listWithStock(organizationId: string, onlyActive: boolean) {
    const products = await this.prisma.client.product.findMany({
      where: { organizationId, ...(onlyActive ? { isActive: true } : {}) },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const movements = await this.prisma.client.stockMovement.groupBy({
      by: ["productId"],
      where: { product: { organizationId } },
      _sum: { delta: true },
    });
    const stockByProduct = new Map(
      movements.map((movement) => [movement.productId, movement._sum.delta ?? 0]),
    );

    return products.map((product) => ({
      ...product,
      stockOnHand: stockByProduct.get(product.id) ?? 0,
    }));
  }

  async create(organizationId: string, actorUserId: string, dto: CreateProductDto) {
    const product = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          organizationId,
          name: dto.name,
          category: dto.category,
          unitPrice: new Prisma.Decimal(dto.unitPrice),
        },
      });

      // La existencia inicial entra como movimiento, no como campo.
      if (dto.initialStock && dto.initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            delta: dto.initialStock,
            reason: StockMovementReason.PURCHASE,
            notes: "Existencia inicial",
            actorUserId,
          },
        });
      }

      return created;
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "inventory.product_create",
      entityType: "Product",
      entityId: product.id,
      metadata: {
        name: product.name,
        unitPrice: product.unitPrice.toString(),
        initialStock: String(dto.initialStock ?? 0),
      },
    });

    return product;
  }

  async update(organizationId: string, actorUserId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.client.product.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException({ errorCode: "PRODUCT_NOT_FOUND" });
    }

    const product = await this.prisma.client.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.unitPrice !== undefined ? { unitPrice: new Prisma.Decimal(dto.unitPrice) } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "inventory.product_update",
      entityType: "Product",
      entityId: product.id,
      metadata: {
        previousPrice: existing.unitPrice.toString(),
        newPrice: product.unitPrice.toString(),
        isActive: String(product.isActive),
      },
    });

    return product;
  }

  /** Historial de movimientos de un producto, para explicar de donde sale la existencia actual. */
  async listMovements(organizationId: string, productId: string) {
    const product = await this.prisma.client.product.findFirst({
      where: { id: productId, organizationId },
    });
    if (!product) {
      throw new NotFoundException({ errorCode: "PRODUCT_NOT_FOUND" });
    }

    return this.prisma.client.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async assertBelongsToOrganization(organizationId: string, productId: string) {
    const product = await this.prisma.client.product.findFirst({
      where: { id: productId, organizationId },
    });
    if (!product) {
      throw new BadRequestException({ errorCode: "PRODUCT_NOT_FOUND" });
    }
    return product;
  }
}
