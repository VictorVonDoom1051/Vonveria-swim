import { Inject, Injectable } from "@nestjs/common";
import { RoleKey } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InstructorsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Vista operativa: quien da que clase, cuando y con cuantos alumnos. El alta
   * de instructores vive en Configuracion -> Usuarios; aqui no se crea nada,
   * para no tener dos formularios que hacen lo mismo.
   */
  async listOverview(organizationId: string) {
    const instructors = await this.prisma.client.user.findMany({
      where: {
        organizationId,
        deletedAt: null,
        roles: { some: { role: { key: RoleKey.INSTRUCTOR } } },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        instructedGroups: {
          select: {
            id: true,
            name: true,
            capacity: true,
            isPublished: true,
            program: { select: { name: true } },
            level: { select: { name: true } },
            pool: { select: { name: true } },
            lane: { select: { name: true } },
            scheduleRules: {
              select: { weekDay: true, startTime: true, durationMinutes: true },
            },
            _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return instructors.map((instructor) => ({
      id: instructor.id,
      fullName: instructor.fullName,
      email: instructor.email,
      status: instructor.status,
      groups: instructor.instructedGroups.map((group) => ({
        id: group.id,
        name: group.name,
        programName: group.program.name,
        levelName: group.level.name,
        poolName: group.pool.name,
        laneName: group.lane?.name ?? null,
        capacity: group.capacity,
        isPublished: group.isPublished,
        activeEnrollments: group._count.enrollments,
        scheduleRules: group.scheduleRules,
      })),
    }));
  }
}
