import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

export interface MethodTotals {
  CASH: Prisma.Decimal;
  TRANSFER: Prisma.Decimal;
  CARD: Prisma.Decimal;
  OTHER: Prisma.Decimal;
}

function sumByMethod(payments: readonly { method: keyof MethodTotals; amount: Prisma.Decimal }[]): MethodTotals {
  return payments.reduce<MethodTotals>(
    (acc, payment) => {
      acc[payment.method] = acc[payment.method].plus(payment.amount);
      return acc;
    },
    {
      CASH: new Prisma.Decimal(0),
      TRANSFER: new Prisma.Decimal(0),
      CARD: new Prisma.Decimal(0),
      OTHER: new Prisma.Decimal(0),
    },
  );
}

@Injectable()
export class CashClosingService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(organizationId: string) {
    return this.prisma.client.cashClosing.findMany({
      where: { organizationId },
      orderBy: { closedAt: "desc" },
    });
  }

  /**
   * Pagos ya recibidos que aun no entran a ningun corte, agrupados por
   * metodo. Se muestra en /pagos/corte ANTES de cerrar, para poder
   * cotejar contra la caja fisica (Section 3: el corte debe reflejar
   * lo cobrado, no solo lo ya cerrado).
   */
  async getOpenSummary(organizationId: string) {
    const openPayments = await this.prisma.client.payment.findMany({
      where: { organizationId, cashClosingId: null },
      include: {
        student: { select: { id: true, fullName: true } },
        allocations: { include: { charge: true } },
        refunds: true,
      },
      orderBy: { receivedAt: "asc" },
    });

    return { totals: sumByMethod(openPayments), payments: openPayments };
  }

  /** Desglose de un corte ya cerrado: cada pago que lo integra y a que cargos se aplico. */
  async getClosingDetail(organizationId: string, closingId: string) {
    const closing = await this.prisma.client.cashClosing.findFirst({
      where: { id: closingId, organizationId },
    });
    if (!closing) {
      throw new NotFoundException({ errorCode: "CASH_CLOSING_NOT_FOUND" });
    }

    const payments = await this.prisma.client.payment.findMany({
      where: { cashClosingId: closingId },
      include: {
        student: { select: { id: true, fullName: true } },
        allocations: { include: { charge: true } },
        refunds: true,
      },
      orderBy: { receivedAt: "asc" },
    });

    return { closing, payments };
  }

  /** Agrupa todos los pagos abiertos (sin corte) por metodo de pago; una sola sucursal en el piloto. */
  async closeCash(organizationId: string, actorUserId: string) {
    const cashClosing = await this.prisma.client.$transaction(async (tx) => {
      const openPayments = await tx.payment.findMany({
        where: { organizationId, cashClosingId: null },
        orderBy: { receivedAt: "asc" },
      });

      if (openPayments.length === 0) {
        throw new BadRequestException({ errorCode: "CASH_CLOSING_NO_OPEN_PAYMENTS" });
      }

      const totals = sumByMethod(openPayments);

      const firstOpenPayment = openPayments[0];
      if (!firstOpenPayment) {
        throw new BadRequestException({ errorCode: "CASH_CLOSING_NO_OPEN_PAYMENTS" });
      }

      const lastClosing = await tx.cashClosing.findFirst({
        where: { organizationId },
        orderBy: { closedAt: "desc" },
      });
      const openedAt = lastClosing?.closedAt ?? firstOpenPayment.receivedAt;

      const created = await tx.cashClosing.create({
        data: {
          organizationId,
          openedAt,
          totalCash: totals.CASH,
          totalTransfer: totals.TRANSFER,
          totalCard: totals.CARD,
          totalOther: totals.OTHER,
          actorUserId,
        },
      });

      await tx.payment.updateMany({
        where: { id: { in: openPayments.map((payment) => payment.id) } },
        data: { cashClosingId: created.id },
      });

      return created;
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "billing.cash_closing_create",
      entityType: "CashClosing",
      entityId: cashClosing.id,
      metadata: {
        totalCash: cashClosing.totalCash.toString(),
        totalTransfer: cashClosing.totalTransfer.toString(),
        totalCard: cashClosing.totalCard.toString(),
        totalOther: cashClosing.totalOther.toString(),
      },
    });

    return cashClosing;
  }
}
