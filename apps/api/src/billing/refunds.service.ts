import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { CreateRefundDto } from "./dto/create-refund.dto";

@Injectable()
export class RefundsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * Solo billing:adjust (Direccion). Decision conservadora M3: el reembolso queda
   * como movimiento contable ligado al pago; no reabre automaticamente los cargos
   * asociados (revertir asignaciones especificas queda para una mejora futura si
   * se detecta un caso real que lo requiera).
   */
  async createRefund(organizationId: string, actorUserId: string, dto: CreateRefundDto) {
    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException({ errorCode: "REFUND_AMOUNT_MUST_BE_POSITIVE" });
    }

    const refund = await this.prisma.client.$transaction(async (tx) => {
      const [paymentRow] = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM payments
        WHERE id = ${dto.paymentId} AND organization_id = ${organizationId}
        FOR UPDATE
      `;
      if (!paymentRow) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: dto.paymentId },
        include: { refunds: true },
      });

      const alreadyRefunded = payment.refunds.reduce(
        (sum, existing) => sum.plus(existing.amount),
        new Prisma.Decimal(0),
      );
      if (alreadyRefunded.plus(amount).greaterThan(payment.amount)) {
        throw new BadRequestException({ errorCode: "REFUND_EXCEEDS_PAYMENT" });
      }

      return tx.refund.create({
        data: {
          paymentId: dto.paymentId,
          amount,
          reason: dto.reason,
          actorUserId,
        },
      });
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "billing.refund_create",
      entityType: "Refund",
      entityId: refund.id,
      metadata: { paymentId: dto.paymentId, amount: dto.amount, reason: dto.reason },
    });

    return refund;
  }
}
