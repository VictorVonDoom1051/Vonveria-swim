import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type BillingModality } from "@vonveria-swim/database";
import {
  ANNUAL_PERIOD_MONTH,
  resolveAnnualPeriod,
  resolveMonthlyChargePeriod,
} from "@vonveria-swim/swimming-core";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import type { EnrollWizardDto } from "./dto/enroll-wizard.dto";

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class EnrollmentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * La inscripcion se cobra una sola vez en la vida del alumno. Se verifica
   * contra su historial completo de cargos, no contra la inscripcion actual: un
   * alumno que se reinscribe años despues no vuelve a pagarla.
   */
  private async hasEverPaidEnrollmentFee(
    tx: TransactionClient,
    studentId: string,
  ): Promise<boolean> {
    const existing = await tx.charge.findFirst({
      where: { studentId, type: "ENROLLMENT_FEE" },
      select: { id: true },
    });
    return existing !== null;
  }

  /**
   * Montos sugeridos al inscribir. Vive aqui y no en /organization porque
   * Recepcion es justamente quien inscribe y no administra la organizacion:
   * si tuviera que leerlos de alla, los capturaria de memoria.
   */
  async getEnrollmentDefaults(organizationId: string) {
    const organization = await this.prisma.client.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { currency: true, defaultAnnualFee: true, defaultEnrollmentFee: true },
    });

    return {
      currency: organization.currency,
      defaultAnnualFee: organization.defaultAnnualFee?.toString() ?? null,
      defaultEnrollmentFee: organization.defaultEnrollmentFee?.toString() ?? null,
    };
  }

  /**
   * Para que el asistente no ofrezca cobrar algo que el backend va a ignorar.
   * Es una ayuda de la interfaz, no el control: la regla la aplica
   * createEnrollmentCharges.
   */
  async getEnrollmentFeeStatus(organizationId: string, studentId: string) {
    const student = await this.prisma.client.student.findFirst({
      where: { id: studentId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!student) {
      throw new NotFoundException({ errorCode: "STUDENT_NOT_FOUND" });
    }

    const charge = await this.prisma.client.charge.findFirst({
      where: { studentId, type: "ENROLLMENT_FEE" },
      select: { id: true },
    });

    return { hasPaidEnrollmentFee: charge !== null };
  }

  /** Anualidad y, si aplica, inscripcion. Comun al alta directa y al wizard. */
  private async createEnrollmentCharges(
    tx: TransactionClient,
    params: {
      organizationId: string;
      studentId: string;
      enrollmentId: string;
      startDate: Date;
      annualFeeAmount: string;
      enrollmentFeeAmount?: string;
    },
  ) {
    const period = resolveAnnualPeriod(params.startDate, params.startDate);

    // La anualidad es por alumno y por año, no por inscripcion: un alumno con
    // dos grupos activos (o que se cambia de nivel) la paga una sola vez. La
    // restriccion unica de Charge es por inscripcion, asi que no basta.
    const annualAlreadyCharged = await tx.charge.findFirst({
      where: { studentId: params.studentId, type: "ANNUAL_FEE", periodYear: period.periodYear },
      select: { id: true },
    });

    if (!annualAlreadyCharged) {
      await tx.charge.create({
        data: {
          organizationId: params.organizationId,
          studentId: params.studentId,
          enrollmentId: params.enrollmentId,
          type: "ANNUAL_FEE",
          description: `Anualidad ${period.periodYear}`,
          amount: new Prisma.Decimal(params.annualFeeAmount),
          dueDate: period.dueDate,
          periodYear: period.periodYear,
          periodMonth: ANNUAL_PERIOD_MONTH,
        },
      });
    }

    if (params.enrollmentFeeAmount) {
      const alreadyPaid = await this.hasEverPaidEnrollmentFee(tx, params.studentId);
      if (!alreadyPaid) {
        await tx.charge.create({
          data: {
            organizationId: params.organizationId,
            studentId: params.studentId,
            enrollmentId: params.enrollmentId,
            type: "ENROLLMENT_FEE",
            description: "Inscripcion",
            amount: new Prisma.Decimal(params.enrollmentFeeAmount),
            dueDate: params.startDate,
          },
        });
      }
    }
  }

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

  async createEnrollment(organizationId: string, actorUserId: string, dto: CreateEnrollmentDto) {
    await this.prisma.client.student.findFirstOrThrow({
      where: { id: dto.studentId, organizationId, deletedAt: null },
    });

    const enrollment = await this.prisma.client.$transaction((tx) =>
      this.enrollWithinTransaction(tx, {
        organizationId,
        actorUserId,
        studentId: dto.studentId,
        groupId: dto.groupId,
        startDate: new Date(dto.startDate),
        annualFeeAmount: dto.annualFeeAmount,
        ...(dto.enrollmentFeeAmount === undefined
          ? {}
          : { enrollmentFeeAmount: dto.enrollmentFeeAmount }),
        ...(dto.billingModality === undefined ? {} : { billingModality: dto.billingModality }),
        ...(dto.monthlyRateAmount === undefined
          ? {}
          : { monthlyRateAmount: dto.monthlyRateAmount }),
        ...(dto.monthlyDueDay === undefined ? {} : { monthlyDueDay: dto.monthlyDueDay }),
      }),
    );

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

  /**
   * Inscripcion completa en un solo paso, para el asistente de recepcion.
   *
   * Familia, tutor, alumno e inscripcion se crean dentro de la misma
   * transaccion: si el grupo resulta lleno al final, no queda una familia
   * huerfana ni un alumno capturado a medias.
   */
  async enrollFromWizard(organizationId: string, actorUserId: string, dto: EnrollWizardDto) {
    if (!dto.studentId && !dto.newStudent) {
      throw new BadRequestException({ errorCode: "STUDENT_REQUIRED" });
    }
    if (!dto.studentId && !dto.familyId && !dto.newGuardian) {
      throw new BadRequestException({ errorCode: "FAMILY_REQUIRED" });
    }

    const result = await this.prisma.client.$transaction(async (tx) => {
      const studentId = await this.resolveStudent(tx, organizationId, dto);

      const enrollment = await this.enrollWithinTransaction(tx, {
        organizationId,
        actorUserId,
        studentId,
        groupId: dto.groupId,
        startDate: new Date(dto.startDate),
        annualFeeAmount: dto.annualFeeAmount,
        ...(dto.enrollmentFeeAmount === undefined
          ? {}
          : { enrollmentFeeAmount: dto.enrollmentFeeAmount }),
        ...(dto.billingModality === undefined ? {} : { billingModality: dto.billingModality }),
        ...(dto.monthlyRateAmount === undefined
          ? {}
          : { monthlyRateAmount: dto.monthlyRateAmount }),
        ...(dto.monthlyDueDay === undefined ? {} : { monthlyDueDay: dto.monthlyDueDay }),
      });

      return { enrollment, studentId };
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "enrollments.enrollment_wizard",
      entityType: "Enrollment",
      entityId: result.enrollment.id,
      metadata: { studentId: result.studentId, groupId: dto.groupId },
    });

    return result.enrollment;
  }

  /** Devuelve el alumno indicado, o crea familia, tutor y alumno si vienen nuevos. */
  private async resolveStudent(
    tx: TransactionClient,
    organizationId: string,
    dto: EnrollWizardDto,
  ): Promise<string> {
    if (dto.studentId) {
      const existing = await tx.student.findFirst({
        where: { id: dto.studentId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException({ errorCode: "STUDENT_NOT_FOUND" });
      }
      return existing.id;
    }

    const newStudent = dto.newStudent!;
    let familyId = dto.familyId;

    if (familyId) {
      const family = await tx.family.findFirst({
        where: { id: familyId, organizationId },
        select: { id: true },
      });
      if (!family) {
        throw new NotFoundException({ errorCode: "FAMILY_NOT_FOUND" });
      }
    } else {
      const family = await tx.family.create({ data: { organizationId } });
      familyId = family.id;

      if (dto.newGuardian) {
        await tx.guardian.create({
          data: {
            familyId,
            fullName: dto.newGuardian.fullName,
            ...(dto.newGuardian.phone ? { phone: dto.newGuardian.phone } : {}),
            ...(dto.newGuardian.email ? { email: dto.newGuardian.email } : {}),
          },
        });
      }
    }

    const student = await tx.student.create({
      data: {
        organizationId,
        familyId,
        fullName: newStudent.fullName,
        ...(newStudent.birthDate ? { birthDate: new Date(newStudent.birthDate) } : {}),
        ...(newStudent.medicalAlerts ? { medicalAlerts: newStudent.medicalAlerts } : {}),
      },
    });

    return student.id;
  }

  /**
   * Bloquea la fila del grupo (SELECT ... FOR UPDATE) antes de revalidar
   * capacidad, para que dos inscripciones simultaneas al ultimo cupo no
   * puedan ambas tener exito (Seccion 13 y prueba de concurrencia de la
   * Seccion 19). Prisma no expone locking en su query builder, de ahi el
   * SQL crudo solo para el lock.
   */
  private async enrollWithinTransaction(
    tx: TransactionClient,
    params: {
      organizationId: string;
      actorUserId: string;
      studentId: string;
      groupId: string;
      startDate: Date;
      annualFeeAmount: string;
      enrollmentFeeAmount?: string;
      billingModality?: BillingModality;
      monthlyRateAmount?: string;
      monthlyDueDay?: number;
    },
  ) {
    const lockResult = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM groups WHERE id = ${params.groupId} FOR UPDATE
    `;
    if (lockResult.length === 0) {
      throw new NotFoundException({ errorCode: "GROUP_NOT_FOUND" });
    }

    const group = await tx.group.findFirst({
      where: { id: params.groupId, organizationId: params.organizationId },
    });
    if (!group) {
      throw new NotFoundException({ errorCode: "GROUP_NOT_FOUND" });
    }

    const activeCount = await tx.enrollment.count({
      where: { groupId: params.groupId, status: "ACTIVE" },
    });
    if (activeCount >= group.capacity) {
      throw new ConflictException({ errorCode: "GROUP_FULL" });
    }

    const existingActive = await tx.enrollment.findFirst({
      where: { studentId: params.studentId, groupId: params.groupId, status: "ACTIVE" },
    });
    if (existingActive) {
      throw new ConflictException({ errorCode: "ALREADY_ENROLLED" });
    }

    const billingModality = params.billingModality ?? "NONE";
    const isMonthly =
      billingModality === "MONTHLY" &&
      params.monthlyRateAmount !== undefined &&
      params.monthlyDueDay !== undefined;

    const created = await tx.enrollment.create({
      data: {
        organizationId: params.organizationId,
        studentId: params.studentId,
        groupId: params.groupId,
        startDate: params.startDate,
        billingModality,
        annualFeeAmount: new Prisma.Decimal(params.annualFeeAmount),
        ...(isMonthly
          ? {
              monthlyRateAmount: new Prisma.Decimal(params.monthlyRateAmount!),
              monthlyDueDay: params.monthlyDueDay!,
            }
          : {}),
      },
    });

    await tx.enrollmentStatusHistory.create({
      data: { enrollmentId: created.id, toStatus: "ACTIVE", actorUserId: params.actorUserId },
    });

    await this.createEnrollmentCharges(tx, {
      organizationId: params.organizationId,
      studentId: params.studentId,
      enrollmentId: created.id,
      startDate: params.startDate,
      annualFeeAmount: params.annualFeeAmount,
      ...(params.enrollmentFeeAmount === undefined
        ? {}
        : { enrollmentFeeAmount: params.enrollmentFeeAmount }),
    });

    // Primera mensualidad, generada aqui; el resto lo genera el job del worker (idempotente por periodo).
    if (isMonthly) {
      const period = resolveMonthlyChargePeriod(params.startDate, params.monthlyDueDay!);
      await tx.charge.create({
        data: {
          organizationId: params.organizationId,
          studentId: params.studentId,
          enrollmentId: created.id,
          type: "MONTHLY_FEE",
          description: `Mensualidad ${period.periodMonth}/${period.periodYear}`,
          amount: new Prisma.Decimal(params.monthlyRateAmount!),
          dueDate: period.dueDate,
          periodYear: period.periodYear,
          periodMonth: period.periodMonth,
        },
      });
    }

    return created;
  }
}
