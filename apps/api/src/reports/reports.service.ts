import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { calculateChargeBalance } from "../billing/balance-calculator";

export interface BillingSummary {
  totalDebt: string;
  collectedInRange: string;
  activePackages: number;
  rangeFrom: string;
  rangeTo: string;
}

@Injectable()
export class ReportsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Todo se calcula desde movimientos (Charge/Payment/PackageCreditMovement), nunca desde totales guardados. */
  async getBillingSummary(organizationId: string, from: Date, to: Date): Promise<BillingSummary> {
    const [pendingCharges, paymentsAggregate, packageCredits] = await Promise.all([
      this.prisma.client.charge.findMany({
        where: { organizationId, status: { in: ["PENDING", "PARTIALLY_PAID"] } },
        include: { adjustments: true, allocations: true },
      }),
      this.prisma.client.payment.aggregate({
        where: { organizationId, receivedAt: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      this.prisma.client.packageCredit.findMany({
        where: { organizationId, validUntil: { gte: new Date() } },
        include: { movements: true },
      }),
    ]);

    const totalDebt = pendingCharges.reduce(
      (sum, charge) =>
        sum.plus(
          calculateChargeBalance({
            amount: charge.amount,
            adjustmentAmounts: charge.adjustments.map((adjustment) => adjustment.amount),
            allocatedAmounts: charge.allocations.map((allocation) => allocation.amount),
          }),
        ),
      new Prisma.Decimal(0),
    );

    const activePackages = packageCredits.filter((credit) => {
      const remaining = credit.movements.reduce(
        (sum, movement) => sum + movement.delta,
        credit.totalUnits,
      );
      return remaining > 0;
    }).length;

    return {
      totalDebt: totalDebt.toString(),
      collectedInRange: (paymentsAggregate._sum.amount ?? new Prisma.Decimal(0)).toString(),
      activePackages,
      rangeFrom: from.toISOString(),
      rangeTo: to.toISOString(),
    };
  }
}
