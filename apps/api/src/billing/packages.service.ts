import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { SellPackageDto } from "./dto/sell-package.dto";
import type { ConsumePackageDto } from "./dto/consume-package.dto";

function remainingUnits(totalUnits: number, movements: readonly { delta: number }[]): number {
  return movements.reduce((sum, movement) => sum + movement.delta, totalUnits);
}

@Injectable()
export class PackagesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async listForStudent(organizationId: string, studentId: string) {
    const credits = await this.prisma.client.packageCredit.findMany({
      where: { organizationId, studentId },
      include: { movements: true, charge: true },
      orderBy: { createdAt: "desc" },
    });

    return credits.map((credit) => ({
      ...credit,
      remainingUnits: remainingUnits(credit.totalUnits, credit.movements),
    }));
  }

  /** Crea el Charge tipo PACKAGE y el PackageCredit asociado en la misma transaccion. */
  async sellPackage(organizationId: string, actorUserId: string, dto: SellPackageDto) {
    await this.prisma.client.student.findFirstOrThrow({
      where: { id: dto.studentId, organizationId, deletedAt: null },
    });

    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + dto.validDays * 24 * 60 * 60 * 1000);

    const packageCredit = await this.prisma.client.$transaction(async (tx) => {
      const charge = await tx.charge.create({
        data: {
          organizationId,
          studentId: dto.studentId,
          ...(dto.enrollmentId ? { enrollmentId: dto.enrollmentId } : {}),
          type: "PACKAGE",
          description: dto.description ?? `Paquete de ${dto.totalUnits} clases`,
          amount: new Prisma.Decimal(dto.amount),
        },
      });

      return tx.packageCredit.create({
        data: {
          organizationId,
          studentId: dto.studentId,
          chargeId: charge.id,
          ...(dto.enrollmentId ? { enrollmentId: dto.enrollmentId } : {}),
          totalUnits: dto.totalUnits,
          validFrom,
          validUntil,
        },
      });
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "billing.package_sell",
      entityType: "PackageCredit",
      entityId: packageCredit.id,
      metadata: { totalUnits: dto.totalUnits, amount: dto.amount },
    });

    return packageCredit;
  }

  async consumeUnit(
    organizationId: string,
    actorUserId: string,
    packageCreditId: string,
    dto: ConsumePackageDto,
  ) {
    return this.applyMovement(organizationId, actorUserId, packageCreditId, -1, dto.sessionId, dto.reason ?? "Consumo manual");
  }

  async returnUnit(
    organizationId: string,
    actorUserId: string,
    packageCreditId: string,
    dto: ConsumePackageDto,
  ) {
    return this.applyMovement(organizationId, actorUserId, packageCreditId, 1, dto.sessionId, dto.reason ?? "Devolucion manual");
  }

  private async applyMovement(
    organizationId: string,
    actorUserId: string,
    packageCreditId: string,
    delta: number,
    sessionId: string | undefined,
    reason: string,
  ) {
    const movement = await this.prisma.client.$transaction(async (tx) => {
      const [creditRow] = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM package_credits
        WHERE id = ${packageCreditId} AND organization_id = ${organizationId}
        FOR UPDATE
      `;
      if (!creditRow) {
        throw new Error("PACKAGE_CREDIT_NOT_FOUND");
      }

      const credit = await tx.packageCredit.findUniqueOrThrow({
        where: { id: packageCreditId },
        include: { movements: true },
      });

      const currentRemaining = remainingUnits(credit.totalUnits, credit.movements);
      if (delta < 0 && currentRemaining + delta < 0) {
        throw new BadRequestException({ errorCode: "PACKAGE_CREDIT_INSUFFICIENT_BALANCE" });
      }
      if (delta > 0 && currentRemaining + delta > credit.totalUnits) {
        throw new BadRequestException({ errorCode: "PACKAGE_CREDIT_EXCEEDS_TOTAL" });
      }

      return tx.packageCreditMovement.create({
        data: {
          packageCreditId,
          delta,
          reason,
          actorUserId,
          ...(sessionId ? { sessionId } : {}),
        },
      });
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: delta < 0 ? "billing.package_consume" : "billing.package_return",
      entityType: "PackageCreditMovement",
      entityId: movement.id,
      metadata: { packageCreditId, delta },
    });

    return movement;
  }
}
