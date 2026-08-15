import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { compact } from "../common/compact";
import type { GuardianDto } from "./dto/guardian.dto";
import type { CreateStudentDto } from "./dto/create-student.dto";

const SEARCH_RESULT_LIMIT = 20;

@Injectable()
export class FamiliesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** Flujo A paso 1: buscar antes de crear, para evitar familias/alumnos duplicados. */
  async search(organizationId: string, query: string) {
    const term = query.trim();
    if (!term) {
      return [];
    }

    return this.prisma.client.family.findMany({
      where: {
        organizationId,
        OR: [
          {
            guardians: {
              some: {
                OR: [
                  { fullName: { contains: term, mode: "insensitive" } },
                  { phone: { contains: term } },
                  { email: { contains: term, mode: "insensitive" } },
                ],
              },
            },
          },
          {
            students: {
              some: { fullName: { contains: term, mode: "insensitive" }, deletedAt: null },
            },
          },
        ],
      },
      include: {
        guardians: true,
        students: { where: { deletedAt: null } },
      },
      take: SEARCH_RESULT_LIMIT,
    });
  }

  async createFamily(organizationId: string, actorUserId: string, guardian: GuardianDto) {
    const family = await this.prisma.client.family.create({
      data: {
        organizationId,
        guardians: {
          create: {
            fullName: guardian.fullName,
            ...compact({ phone: guardian.phone, email: guardian.email }),
          },
        },
      },
      include: { guardians: true },
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "families.family_create",
      entityType: "Family",
      entityId: family.id,
    });

    return family;
  }

  async addGuardian(
    organizationId: string,
    actorUserId: string,
    familyId: string,
    guardian: GuardianDto,
  ) {
    await this.prisma.client.family.findFirstOrThrow({ where: { id: familyId, organizationId } });

    const created = await this.prisma.client.guardian.create({
      data: {
        familyId,
        fullName: guardian.fullName,
        ...compact({ phone: guardian.phone, email: guardian.email }),
      },
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "families.guardian_create",
      entityType: "Guardian",
      entityId: created.id,
    });

    return created;
  }

  async createStudent(
    organizationId: string,
    actorUserId: string,
    familyId: string,
    dto: CreateStudentDto,
  ) {
    await this.prisma.client.family.findFirstOrThrow({ where: { id: familyId, organizationId } });

    const student = await this.prisma.client.student.create({
      data: {
        organizationId,
        familyId,
        fullName: dto.fullName,
        ...(dto.birthDate ? { birthDate: new Date(dto.birthDate) } : {}),
        ...(dto.medicalAlerts !== undefined ? { medicalAlerts: dto.medicalAlerts } : {}),
        ...(dto.emergencyContacts?.length
          ? { emergencyContacts: { create: dto.emergencyContacts } }
          : {}),
      },
      include: { emergencyContacts: true },
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "families.student_create",
      entityType: "Student",
      entityId: student.id,
    });

    return student;
  }

  getFamily(organizationId: string, familyId: string) {
    return this.prisma.client.family.findFirstOrThrow({
      where: { id: familyId, organizationId },
      include: {
        guardians: true,
        students: { where: { deletedAt: null }, include: { emergencyContacts: true } },
      },
    });
  }

  getStudent(organizationId: string, studentId: string) {
    return this.prisma.client.student.findFirstOrThrow({
      where: { id: studentId, organizationId, deletedAt: null },
      include: {
        family: { include: { guardians: true } },
        emergencyContacts: true,
        enrollments: {
          include: { group: { include: { program: true, level: true, branch: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }
}
