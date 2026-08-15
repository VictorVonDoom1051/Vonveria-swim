import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { calculateChargeBalance } from "./balance-calculator";
import { allocatePayment } from "./payment-allocator";
import type { CreatePaymentDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async listForStudent(organizationId: string, studentId: string) {
    return this.prisma.client.payment.findMany({
      where: { organizationId, studentId },
      include: { allocations: { include: { charge: true } }, refunds: true },
      orderBy: { receivedAt: "desc" },
    });
  }

  async getReceipt(organizationId: string, paymentId: string) {
    return this.prisma.client.payment.findFirstOrThrow({
      where: { id: paymentId, organizationId },
      include: {
        student: { select: { id: true, fullName: true } },
        allocations: { include: { charge: true } },
        refunds: true,
      },
    });
  }

  /**
   * Asigna el pago a los cargos abiertos mas antiguos primero, hasta agotar el monto.
   * El sobrante (si el pago excede lo debido) queda sin asignar, como saldo a favor.
   */
  async createPayment(organizationId: string, actorUserId: string, dto: CreatePaymentDto) {
    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException({ errorCode: "PAYMENT_AMOUNT_MUST_BE_POSITIVE" });
    }

    await this.prisma.client.student.findFirstOrThrow({
      where: { id: dto.studentId, organizationId, deletedAt: null },
    });

    const payment = await this.prisma.client.$transaction(async (tx) => {
      const openChargeRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM charges
        WHERE student_id = ${dto.studentId}
          AND organization_id = ${organizationId}
          AND status IN ('PENDING', 'PARTIALLY_PAID')
        ORDER BY due_date ASC NULLS LAST, created_at ASC
        FOR UPDATE
      `;

      const openCharges = await tx.charge.findMany({
        where: { id: { in: openChargeRows.map((row) => row.id) } },
        include: { adjustments: true, allocations: true },
      });
      const chargesById = new Map(openCharges.map((charge) => [charge.id, charge]));

      const allocatable = openChargeRows
        .map((row) => chargesById.get(row.id))
        .filter((charge): charge is NonNullable<typeof charge> => charge !== undefined)
        .map((charge) => ({
          chargeId: charge.id,
          balance: calculateChargeBalance({
            amount: charge.amount,
            adjustmentAmounts: charge.adjustments.map((adjustment) => adjustment.amount),
            allocatedAmounts: charge.allocations.map((allocation) => allocation.amount),
          }),
        }));

      const { allocations } = allocatePayment(amount, allocatable);

      const createdPayment = await tx.payment.create({
        data: {
          organizationId,
          studentId: dto.studentId,
          amount,
          method: dto.method,
          actorUserId,
          ...(dto.receivedAt ? { receivedAt: new Date(dto.receivedAt) } : {}),
        },
      });

      for (const allocation of allocations) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: createdPayment.id,
            chargeId: allocation.chargeId,
            amount: allocation.amount,
          },
        });

        const charge = chargesById.get(allocation.chargeId);
        if (!charge) {
          continue;
        }
        const previousAllocated = charge.allocations.reduce(
          (sum, existing) => sum.plus(existing.amount),
          new Prisma.Decimal(0),
        );
        const adjustmentsTotal = charge.adjustments.reduce(
          (sum, adjustment) => sum.plus(adjustment.amount),
          new Prisma.Decimal(0),
        );
        const newAllocated = previousAllocated.plus(allocation.amount);
        const newBalance = charge.amount.plus(adjustmentsTotal).minus(newAllocated);

        await tx.charge.update({
          where: { id: allocation.chargeId },
          data: { status: newBalance.lessThanOrEqualTo(0) ? "PAID" : "PARTIALLY_PAID" },
        });
      }

      return createdPayment;
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "billing.payment_create",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { amount: dto.amount, method: dto.method },
    });

    return payment;
  }
}
