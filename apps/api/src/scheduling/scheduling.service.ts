import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { compact } from "../common/compact";
import { rangesOverlap, type TimeRange } from "./schedule-overlap";
import { generateSessions } from "./session-generation";
import type { CreateGroupDto } from "./dto/create-group.dto";

export interface ScheduleConflict {
  groupId: string;
  groupName: string;
  weekDay: string;
  startTime: string;
}

@Injectable()
export class SchedulingService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  listGroups(organizationId: string) {
    return this.prisma.client.group.findMany({
      where: { organizationId },
      include: {
        program: true,
        level: true,
        branch: true,
        pool: true,
        lane: true,
        instructor: { select: { id: true, fullName: true } },
        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { name: "asc" },
    });
  }

  getGroup(organizationId: string, groupId: string) {
    return this.prisma.client.group.findFirstOrThrow({
      where: { id: groupId, organizationId },
      include: {
        program: true,
        level: true,
        branch: true,
        pool: true,
        lane: true,
        instructor: { select: { id: true, fullName: true } },
        scheduleRules: true,
        sessions: { orderBy: { startsAt: "asc" }, take: 10 },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: { select: { id: true, fullName: true } } },
        },
      },
    });
  }

  async createGroup(organizationId: string, actorUserId: string, dto: CreateGroupDto) {
    await this.assertCatalogBelongsToOrg(organizationId, dto);

    const conflicts = await this.findConflicts(
      organizationId,
      dto.instructorId,
      dto.laneId,
      dto.scheduleRules,
    );
    if (conflicts.length > 0) {
      throw new ConflictException({ errorCode: "SCHEDULING_CONFLICT", conflicts });
    }

    const group = await this.prisma.client.group.create({
      data: {
        organizationId,
        name: dto.name,
        programId: dto.programId,
        levelId: dto.levelId,
        branchId: dto.branchId,
        poolId: dto.poolId,
        capacity: dto.capacity,
        ...compact({ laneId: dto.laneId, instructorId: dto.instructorId }),
        scheduleRules: { create: dto.scheduleRules },
      },
      include: { scheduleRules: true },
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "scheduling.group_create",
      entityType: "Group",
      entityId: group.id,
    });

    return group;
  }

  async publishGroup(organizationId: string, actorUserId: string, groupId: string) {
    const group = await this.prisma.client.group.findFirstOrThrow({
      where: { id: groupId, organizationId },
      include: { scheduleRules: true },
    });

    const sessions = generateSessions(group.scheduleRules, new Date());

    await this.prisma.client.$transaction([
      this.prisma.client.group.update({ where: { id: group.id }, data: { isPublished: true } }),
      this.prisma.client.classSession.createMany({
        data: sessions.map((session) => ({
          groupId: group.id,
          startsAt: session.startsAt,
          endsAt: session.endsAt,
        })),
        skipDuplicates: true,
      }),
    ]);

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "scheduling.group_publish",
      entityType: "Group",
      entityId: group.id,
      metadata: { sessionsGenerated: sessions.length },
    });

    return this.getGroup(organizationId, groupId);
  }

  /** Sesiones de hoy y próximos 7 días para un instructor (sin capacidad especial: cada quien ve lo suyo). */
  /**
   * Sesiones proximas de toda la escuela. Es lo que consulta Recepcion y
   * Direccion en /asistencia, donde marcan el aviso de falta: a diferencia de
   * listTodaySessionsForInstructor no se filtra por instructor.
   */
  listUpcomingSessionsForOrganization(organizationId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfDay);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return this.prisma.client.classSession.findMany({
      where: {
        startsAt: { gte: startOfDay, lt: endOfWeek },
        group: { organizationId },
      },
      include: {
        group: {
          include: {
            program: true,
            level: true,
            instructor: { select: { id: true, fullName: true } },
            enrollments: {
              where: { status: "ACTIVE" },
              include: { student: { select: { id: true, fullName: true } } },
            },
          },
        },
      },
      orderBy: { startsAt: "asc" },
    });
  }

  listTodaySessionsForInstructor(instructorId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfDay);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return this.prisma.client.classSession.findMany({
      where: {
        startsAt: { gte: startOfDay, lt: endOfWeek },
        group: { instructorId },
      },
      include: {
        group: {
          include: {
            program: true,
            level: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: { student: { select: { id: true, fullName: true } } },
            },
          },
        },
      },
      orderBy: { startsAt: "asc" },
    });
  }

  private async assertCatalogBelongsToOrg(
    organizationId: string,
    dto: CreateGroupDto,
  ): Promise<void> {
    await this.prisma.client.program.findFirstOrThrow({
      where: { id: dto.programId, organizationId },
    });
    await this.prisma.client.level.findFirstOrThrow({
      where: { id: dto.levelId, programId: dto.programId },
    });
    await this.prisma.client.branch.findFirstOrThrow({
      where: { id: dto.branchId, organizationId },
    });
    await this.prisma.client.pool.findFirstOrThrow({
      where: { id: dto.poolId, branchId: dto.branchId },
    });
    if (dto.laneId) {
      await this.prisma.client.lane.findFirstOrThrow({
        where: { id: dto.laneId, poolId: dto.poolId },
      });
    }
    if (dto.instructorId) {
      await this.prisma.client.user.findFirstOrThrow({
        where: { id: dto.instructorId, organizationId },
      });
    }
  }

  private async findConflicts(
    organizationId: string,
    instructorId: string | undefined,
    laneId: string | undefined,
    newRules: readonly TimeRange[],
    excludeGroupId?: string,
  ): Promise<ScheduleConflict[]> {
    const sharedResourceFilters: Prisma.GroupWhereInput[] = [];
    if (instructorId) {
      sharedResourceFilters.push({ instructorId });
    }
    if (laneId) {
      sharedResourceFilters.push({ laneId });
    }
    if (sharedResourceFilters.length === 0) {
      return [];
    }

    const candidates = await this.prisma.client.group.findMany({
      where: {
        organizationId,
        OR: sharedResourceFilters,
        ...(excludeGroupId ? { id: { not: excludeGroupId } } : {}),
      },
      include: { scheduleRules: true },
    });

    const conflicts: ScheduleConflict[] = [];
    for (const candidate of candidates) {
      for (const existingRule of candidate.scheduleRules) {
        for (const newRule of newRules) {
          if (rangesOverlap(existingRule, newRule)) {
            conflicts.push({
              groupId: candidate.id,
              groupName: candidate.name,
              weekDay: existingRule.weekDay,
              startTime: existingRule.startTime,
            });
          }
        }
      }
    }
    return conflicts;
  }
}
