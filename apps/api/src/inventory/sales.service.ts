import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, StockMovementReason } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { calculateLineTotal, calculateSaleTotal } from "./sale-calculator";
import { calculateStockOnHand } from "./stock-calculator";
import type { CreateSaleDto } from "./dto/create-sale.dto";

@Injectable()
export class SalesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(organizationId: string) {
    return this.prisma.client.sale.findMany({
      where: { organizationId },
      include: { lines: { include: { product: { select: { id: true, name: true } } } } },
      orderBy: { soldAt: "desc" },
      take: 100,
    });
  }

  async getById(organizationId: string, saleId: string) {
    const sale = await this.prisma.client.sale.findFirst({
      where: { id: saleId, organizationId },
      include: { lines: { include: { product: { select: { id: true, name: true } } } } },
    });
    if (!sale) {
      throw new NotFoundException({ errorCode: "SALE_NOT_FOUND" });
    }
    return sale;
  }

  /**
   * Venta de mostrador, pagada en el momento. No genera Charge ni Payment: no se
   * liga a ningun alumno (ADR de M7). Entra al corte de caja a traves de
   * cashClosingId, que CashClosingService asigna al cerrar.
   *
   * Bloquea las filas de producto (SELECT ... FOR UPDATE) antes de revalidar
   * existencias, para que dos ventas simultaneas del ultimo articulo no puedan
   * ambas tener exito. Mismo patron que el cupo de un grupo en
   * enrollments.service.ts. Las filas se bloquean ordenadas por id para que dos
   * carritos con productos en comun no se traben entre si.
   */
  async createSale(organizationId: string, actorUserId: string, dto: CreateSaleDto) {
    const quantityByProduct = new Map<string, number>();
    for (const line of dto.lines) {
      quantityByProduct.set(
        line.productId,
        (quantityByProduct.get(line.productId) ?? 0) + line.quantity,
      );
    }
    const productIds = [...quantityByProduct.keys()].sort();

    const sale = await this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM products WHERE id IN (${Prisma.join(productIds)}) ORDER BY id FOR UPDATE`,
      );

      const products = await tx.product.findMany({
        where: { id: { in: productIds }, organizationId },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundException({ errorCode: "PRODUCT_NOT_FOUND" });
      }

      const inactive = products.find((product) => !product.isActive);
      if (inactive) {
        throw new ConflictException({
          errorCode: "PRODUCT_INACTIVE",
          productName: inactive.name,
        });
      }

      const movements = await tx.stockMovement.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds } },
        _sum: { delta: true },
      });
      const stockByProduct = new Map(
        movements.map((movement) => [movement.productId, movement._sum.delta ?? 0]),
      );

      for (const product of products) {
        const requested = quantityByProduct.get(product.id) ?? 0;
        const available = calculateStockOnHand([stockByProduct.get(product.id) ?? 0]);
        if (available < requested) {
          throw new ConflictException({
            errorCode: "INSUFFICIENT_STOCK",
            productName: product.name,
            requested,
            available,
          });
        }
      }

      const lines = products.map((product) => {
        const quantity = quantityByProduct.get(product.id) ?? 0;
        return {
          productId: product.id,
          quantity,
          unitPrice: product.unitPrice,
          lineTotal: calculateLineTotal({ quantity, unitPrice: product.unitPrice }),
        };
      });

      const created = await tx.sale.create({
        data: {
          organizationId,
          total: calculateSaleTotal(lines),
          method: dto.method,
          actorUserId,
          lines: { create: lines },
        },
        include: { lines: { include: { product: { select: { id: true, name: true } } } } },
      });

      await tx.stockMovement.createMany({
        data: lines.map((line) => ({
          productId: line.productId,
          delta: -line.quantity,
          reason: StockMovementReason.SALE,
          saleId: created.id,
          actorUserId,
        })),
      });

      return created;
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "inventory.sale_create",
      entityType: "Sale",
      entityId: sale.id,
      metadata: {
        total: sale.total.toString(),
        method: sale.method,
        lines: sale.lines.map((line) => `${line.product.name} x${line.quantity}`).join(", "),
      },
    });

    return sale;
  }
}
