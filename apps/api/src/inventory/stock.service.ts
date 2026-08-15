import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { StockMovementReason } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ProductsService } from "./products.service";
import { calculateStockOnHand } from "./stock-calculator";
import type { CreateStockMovementDto } from "./dto/create-stock-movement.dto";

@Injectable()
export class StockService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ProductsService) private readonly products: ProductsService,
  ) {}

  async getStockOnHand(productId: string): Promise<number> {
    const movements = await this.prisma.client.stockMovement.findMany({
      where: { productId },
      select: { delta: true },
    });
    return calculateStockOnHand(movements.map((movement) => movement.delta));
  }

  /**
   * Entrada de mercancia o ajuste de inventario. Un ajuste siempre exige motivo:
   * es la operacion por la que se puede hacer desaparecer mercancia sin dejar
   * rastro, asi que queda auditada con quien y por que.
   */
  async registerMovement(
    organizationId: string,
    actorUserId: string,
    productId: string,
    dto: CreateStockMovementDto,
  ) {
    const product = await this.products.assertBelongsToOrganization(organizationId, productId);

    if (dto.reason === StockMovementReason.ADJUSTMENT && !dto.notes) {
      throw new BadRequestException({ errorCode: "STOCK_ADJUSTMENT_REQUIRES_NOTES" });
    }

    const movement = await this.prisma.client.stockMovement.create({
      data: {
        productId,
        delta: dto.delta,
        reason: dto.reason,
        ...(dto.notes ? { notes: dto.notes } : {}),
        actorUserId,
      },
    });

    const stockOnHand = await this.getStockOnHand(productId);

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "inventory.stock_movement",
      entityType: "Product",
      entityId: productId,
      ...(dto.notes ? { reason: dto.notes } : {}),
      metadata: {
        productName: product.name,
        delta: String(dto.delta),
        movementReason: dto.reason,
        stockOnHand: String(stockOnHand),
      },
    });

    return { movement, stockOnHand };
  }
}
