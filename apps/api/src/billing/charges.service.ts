import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ChargeType, Prisma } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { calculateChargeBalance } from "./balance-calculator";
import type { CreateChargeDto } from "./dto/create-charge.dto";

const MANUALLY_CREATABLE_TYPES = new Set<ChargeType>([ChargeType.SINGLE_CLASS, ChargeType.OTHER]);

@Injectable()
export class ChargesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** Cargos de un alumno con su saldo calculado desde movimientos (Seccion 11). */
  async listForStudent(organizationId: string, studentId: string) {
    const charges = await this.prisma.client.charge.findMany({
      where: { organizationId, studentId },
      include: { adjustments: true, allocations: true },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    });

    return charges.map((charge) => ({
      ...charge,
      balance: calculateChargeBalance({
        amount: charge.amount,
        adjustmentAmounts: charge.adjustments.map((adjustment) => adjustment.amount),
        allocatedAmounts: charge.allocations.map((allocation) => allocation.amount),
      }),
    }));
  }

  async listPending(organizationId: string) {
    const charges = await this.prisma.client.charge.findMany({
      where: { organizationId, status: { in: ["PENDING", "PARTIALLY_PAID"] } },
      include: {
        adjustments: true,
        allocations: true,
        student: { select: { id: true, fullName: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    });

    return charges.map((charge) => ({
      ...charge,
      balance: calculateChargeBalance({
        amount: charge.amount,
        adjustmentAmounts: charge.adjustments.map((adjustment) => adjustment.amount),
        allocatedAmounts: charge.allocations.map((allocation) => allocation.amount),
      }),
    }));
  }

  /** Solo para SINGLE_CLASS u OTHER; el resto de los tipos de cargo tiene su propio flujo. */
  async createManualCharge(organizationId: string, actorUserId: string, dto: CreateChargeDto) {
    if (!MANUALLY_CREATABLE_TYPES.has(dto.type)) {
      throw new BadRequestException({ errorCode: "CHARGE_TYPE_NOT_MANUAL" });
    }

    await this.prisma.client.student.findFirstOrThrow({
      where: { id: dto.studentId, organizationId, deletedAt: null },
    });

    const charge = await this.prisma.client.charge.create({
      data: {
        organizationId,
        studentId: dto.studentId,
        type: dto.type,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        ...(dto.dueDate ? { dueDate: new Date(dto.dueDate) } : {}),
      },
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "billing.charge_create",
      entityType: "Charge",
      entityId: charge.id,
      metadata: { type: dto.type, amount: dto.amount },
    });

    return charge;
  }

  /**
   * Decision conservadora M3: solo se puede cancelar un cargo que aun no
   * tiene pagos aplicados; un cargo ya cobrado (total o parcial) se corrige
   * con un Adjustment/Refund, no con cancelacion (Seccion 12: nunca borrar
   * o modificar silenciosamente un movimiento financiero).
   */
  async cancelCharge(organizationId: string, actorUserId: string, chargeId: string) {
    const charge = await this.prisma.client.$transaction(async (tx) => {
      const [chargeRow] = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM charges WHERE id = ${chargeId} AND organization_id = ${organizationId}
        FOR UPDATE
      `;
      if (!chargeRow) {
        throw new NotFoundException({ errorCode: "CHARGE_NOT_FOUND" });
      }

      const existing = await tx.charge.findUniqueOrThrow({
        where: { id: chargeId },
        include: { allocations: true },
      });
      if (existing.allocations.length > 0) {
        throw new BadRequestException({ errorCode: "CHARGE_HAS_PAYMENTS" });
      }

      return tx.charge.update({ where: { id: chargeId }, data: { status: "CANCELLED" } });
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "billing.charge_cancel",
      entityType: "Charge",
      entityId: charge.id,
    });

    return charge;
  }
}
