import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { calculateChargeBalance } from "./balance-calculator";
import type { CreateAdjustmentDto } from "./dto/create-adjustment.dto";

@Injectable()
export class AdjustmentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** Solo billing:adjust (Direccion). El monto puede ser negativo (descuento) o positivo. */
  async createAdjustment(organizationId: string, actorUserId: string, dto: CreateAdjustmentDto) {
    const amount = new Prisma.Decimal(dto.amount);

    const adjustment = await this.prisma.client.$transaction(async (tx) => {
      const [chargeRow] = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM charges
        WHERE id = ${dto.chargeId} AND organization_id = ${organizationId}
        FOR UPDATE
      `;
      if (!chargeRow) {
        throw new Error("CHARGE_NOT_FOUND");
      }

      const charge = await tx.charge.findUniqueOrThrow({
        where: { id: dto.chargeId },
        include: { adjustments: true, allocations: true },
      });

      const created = await tx.adjustment.create({
        data: {
          chargeId: dto.chargeId,
          amount,
          reason: dto.reason,
          actorUserId,
        },
      });

      const newBalance = calculateChargeBalance({
        amount: charge.amount,
        adjustmentAmounts: [...charge.adjustments.map((a) => a.amount), amount],
        allocatedAmounts: charge.allocations.map((a) => a.amount),
      });

      await tx.charge.update({
        where: { id: dto.chargeId },
        data: {
          status: newBalance.lessThanOrEqualTo(0)
            ? "PAID"
            : charge.allocations.length > 0
              ? "PARTIALLY_PAID"
              : "PENDING",
        },
      });

      return created;
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "billing.adjustment_create",
      entityType: "Adjustment",
      entityId: adjustment.id,
      metadata: { chargeId: dto.chargeId, amount: dto.amount, reason: dto.reason },
    });

    return adjustment;
  }
}
