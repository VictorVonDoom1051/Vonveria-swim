import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ChargesService } from "../billing/charges.service";
import { resolveLaneOccupancy, type OccupancySession } from "./lane-occupancy";

export interface SessionWithGroup extends OccupancySession {
  group: {
    id: string;
    name: string;
    laneId: string | null;
    instructor: { id: string; fullName: string } | null;
  };
}

function startOfToday(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfToday(now: Date): Date {
  const end = startOfToday(now);
  end.setDate(end.getDate() + 1);
  return end;
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ChargesService) private readonly charges: ChargesService,
  ) {}

  /**
   * Panel de inicio: lo que esta pasando ahora en las albercas y lo que exige
   * atencion. Orientado a excepciones, no a cifras de relleno (Seccion 3).
   *
   * includeBilling refleja la capacidad billing:manage. Se decide en el
   * controlador para que la interfaz y la API no razonen con criterios distintos.
   */
  async getToday(organizationId: string, includeBilling: boolean, now = new Date()) {
    const [pools, sessions, absences, overdueCharges] = await Promise.all([
      this.prisma.client.pool.findMany({
        where: { branch: { organizationId } },
        include: { lanes: { orderBy: { name: "asc" } }, branch: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.client.classSession.findMany({
        where: {
          startsAt: { gte: startOfToday(now), lt: endOfToday(now) },
          group: { organizationId },
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          group: {
            select: {
              id: true,
              name: true,
              poolId: true,
              laneId: true,
              instructor: { select: { id: true, fullName: true } },
            },
          },
        },
      }),
      this.prisma.client.attendance.findMany({
        where: {
          status: "ABSENT_JUSTIFIED",
          session: {
            startsAt: { gte: startOfToday(now), lt: endOfToday(now) },
            group: { organizationId },
          },
        },
        select: {
          id: true,
          notes: true,
          student: { select: { id: true, fullName: true } },
          session: {
            select: { id: true, startsAt: true, group: { select: { id: true, name: true } } },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      includeBilling ? this.charges.listPending(organizationId) : Promise.resolve([]),
    ]);

    const sessionsByPool = new Map<string, SessionWithGroup[]>();
    for (const session of sessions) {
      const list = sessionsByPool.get(session.group.poolId) ?? [];
      list.push(session);
      sessionsByPool.set(session.group.poolId, list);
    }

    const poolMap = pools.map((pool) => {
      const poolSessions = sessionsByPool.get(pool.id) ?? [];

      const lanes = pool.lanes.map((lane) => ({
        id: lane.id,
        name: lane.name,
        ...resolveLaneOccupancy(
          poolSessions.filter((session) => session.group.laneId === lane.id),
          now,
        ),
      }));

      // Las clases sin carril asignado (o una alberca sin carriles, como la
      // chica para clases personalizadas) ocupan la alberca entera.
      const unassigned = resolveLaneOccupancy(
        poolSessions.filter((session) => session.group.laneId === null),
        now,
      );

      return {
        id: pool.id,
        name: pool.name,
        branchName: pool.branch.name,
        lanes,
        poolLevel: unassigned,
      };
    });

    const overdue = overdueCharges.filter(
      (charge) => charge.dueDate !== null && charge.dueDate < startOfToday(now),
    );

    return { pools: poolMap, overdueCharges: overdue, todayAbsences: absences };
  }
}
