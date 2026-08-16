import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { CreateAssessmentDto } from "./dto/create-assessment.dto";

@Injectable()
export class AssessmentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * Alumnos que un usuario puede evaluar. Direccion ve a todos; un instructor
   * solo a los inscritos en sus propios grupos.
   *
   * El filtro vive aqui y no en la interfaz: es la misma regla que aplica
   * assertCanAssess, para que ocultar un nombre y rechazar la peticion no puedan
   * separarse (Seccion 15).
   */
  async listAssessableStudents(organizationId: string, userId: string, seesAll: boolean) {
    return this.prisma.client.student.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(seesAll
          ? {}
          : {
              enrollments: {
                some: { status: "ACTIVE", group: { instructorId: userId } },
              },
            }),
      },
      select: {
        id: true,
        fullName: true,
        enrollments: {
          where: { status: "ACTIVE" },
          select: { group: { select: { name: true, level: { select: { name: true } } } } },
          take: 1,
        },
      },
      orderBy: { fullName: "asc" },
    });
  }

  private async assertCanAssess(
    organizationId: string,
    userId: string,
    seesAll: boolean,
    studentId: string,
  ) {
    const student = await this.prisma.client.student.findFirst({
      where: {
        id: studentId,
        organizationId,
        deletedAt: null,
        ...(seesAll
          ? {}
          : {
              enrollments: {
                some: { status: "ACTIVE", group: { instructorId: userId } },
              },
            }),
      },
    });
    if (!student) {
      throw new ForbiddenException({ errorCode: "STUDENT_NOT_ASSESSABLE" });
    }
    return student;
  }

  async list(organizationId: string, userId: string, seesAll: boolean) {
    return this.prisma.client.assessment.findMany({
      where: {
        organizationId,
        ...(seesAll
          ? {}
          : {
              student: {
                enrollments: {
                  some: { status: "ACTIVE", group: { instructorId: userId } },
                },
              },
            }),
      },
      include: {
        student: { select: { id: true, fullName: true } },
        evaluator: { select: { id: true, fullName: true } },
        suggestedLevel: { select: { id: true, name: true } },
      },
      orderBy: { assessedAt: "desc" },
      take: 100,
    });
  }

  async create(organizationId: string, userId: string, seesAll: boolean, dto: CreateAssessmentDto) {
    const student = await this.assertCanAssess(organizationId, userId, seesAll, dto.studentId);

    const assessment = await this.prisma.client.assessment.create({
      data: {
        organizationId,
        studentId: dto.studentId,
        evaluatorUserId: userId,
        observation: dto.observation,
        ...(dto.suggestedLevelId ? { suggestedLevelId: dto.suggestedLevelId } : {}),
      },
      include: {
        student: { select: { id: true, fullName: true } },
        evaluator: { select: { id: true, fullName: true } },
        suggestedLevel: { select: { id: true, name: true } },
      },
    });

    await this.audit.record({
      organizationId,
      actorUserId: userId,
      action: "assessments.create",
      entityType: "Assessment",
      entityId: assessment.id,
      metadata: {
        studentName: student.fullName,
        suggestedLevel: assessment.suggestedLevel?.name ?? "sin sugerencia",
      },
    });

    return assessment;
  }
}
