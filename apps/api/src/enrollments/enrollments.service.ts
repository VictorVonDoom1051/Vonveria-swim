import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@vonveria-swim/database";
import { resolveMonthlyChargePeriod } from "@vonveria-swim/swimming-core";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { CreateEnrollmentDto } from "./dto/create-enrollment.dto";

@Injectable()
export class EnrollmentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async findCompatibleGroups(organizationId: string, programId: string, levelId: string) {
    const groups = await this.prisma.client.group.findMany({
      where: { organizationId, programId, levelId, isPublished: true },
      include: {
        branch: true,
        pool: true,
        lane: true,
        instructor: { select: { id: true, fullName: true } },
        scheduleRules: true,
        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
      },
    });

    return groups
      .map((group) => ({ ...group, availableSpots: group.capacity - group._count.enrollments }))
      .filter((group) => group.availableSpots > 0);
  }

  /**
   * Bloquea la fila del grupo (SELECT ... FOR UPDATE) antes de revalidar
   * capacidad, para que dos inscripciones simultaneas al ultimo cupo no
   * puedan ambas tener exito (Seccion 13 y prueba de concurrencia de la
   * Seccion 19). Prisma no expone locking en su query builder, de ahi el
   * SQL crudo solo para el lock.
   */
  async createEnrollment(organizationId: string, actorUserId: string, dto: CreateEnrollmentDto) {
    await this.prisma.client.student.findFirstOrThrow({
      where: { id: dto.studentId, organizationId, deletedAt: null },
    });

    const enrollment = await this.prisma.client.$transaction(async (tx) => {
      const lockResult = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM groups WHERE id = ${dto.groupId} FOR UPDATE
      `;
      if (lockResult.length === 0) {
        throw new NotFoundException({ errorCode: "GROUP_NOT_FOUND" });
      }

      const group = await tx.group.findFirstOrThrow({ where: { id: dto.groupId, organizationId } });

      const activeCount = await tx.enrollment.count({
        where: { groupId: dto.groupId, status: "ACTIVE" },
      });
      if (activeCount >= group.capacity) {
        throw new ConflictException({ errorCode: "GROUP_FULL" });
      }

      const existingActive = await tx.enrollment.findFirst({
        where: { studentId: dto.studentId, groupId: dto.groupId, status: "ACTIVE" },
      });
      if (existingActive) {
        throw new ConflictException({ errorCode: "ALREADY_ENROLLED" });
      }

      const startDate = new Date(dto.startDate);
      const billingModality = dto.billingModality ?? "NONE";

      const created = await tx.enrollment.create({
        data: {
          organizationId,
          studentId: dto.studentId,
          groupId: dto.groupId,
          startDate,
          billingModality,
          ...(billingModality === "MONTHLY" && dto.monthlyRateAmount && dto.monthlyDueDay
            ? {
                monthlyRateAmount: new Prisma.Decimal(dto.monthlyRateAmount),
                monthlyDueDay: dto.monthlyDueDay,
              }
            : {}),
        },
      });

      await tx.enrollmentStatusHistory.create({
        data: { enrollmentId: created.id, toStatus: "ACTIVE", actorUserId },
      });

      // Cargo unico de inscripcion, independiente de la modalidad recurrente.
      if (dto.enrollmentFeeAmount) {
        await tx.charge.create({
          data: {
            organizationId,
            studentId: dto.studentId,
            enrollmentId: created.id,
            type: "ENROLLMENT_FEE",
            description: "Inscripcion",
            amount: new Prisma.Decimal(dto.enrollmentFeeAmount),
            dueDate: startDate,
          },
        });
      }

      // Primera mensualidad, generada aqui; el resto lo genera el job del worker (idempotente por periodo).
      if (billingModality === "MONTHLY" && dto.monthlyRateAmount && dto.monthlyDueDay) {
        const period = resolveMonthlyChargePeriod(startDate, dto.monthlyDueDay);
        await tx.charge.create({
          data: {
            organizationId,
            studentId: dto.studentId,
            enrollmentId: created.id,
            type: "MONTHLY_FEE",
            description: `Mensualidad ${period.periodMonth}/${period.periodYear}`,
            amount: new Prisma.Decimal(dto.monthlyRateAmount),
            dueDate: period.dueDate,
            periodYear: period.periodYear,
            periodMonth: period.periodMonth,
          },
        });
      }

      return created;
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "enrollments.enrollment_create",
      entityType: "Enrollment",
      entityId: enrollment.id,
      metadata: { studentId: dto.studentId, groupId: dto.groupId },
    });

    return enrollment;
  }
}
