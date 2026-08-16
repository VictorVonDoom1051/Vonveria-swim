import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

export interface SessionAttendance {
  sessionId: string;
  studentId: string;
  status: "PRESENT" | "ABSENT_JUSTIFIED";
  notes?: string | null;
  actorUserId?: string | null;
  updatedAt: Date;
}

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async markAbsent(
    organizationId: string,
    sessionId: string,
    studentId: string,
    notes: string | null,
    actorUserId: string,
  ): Promise<SessionAttendance> {
    const upserted = await this.prisma.client.attendance.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      create: {
        sessionId,
        studentId,
        status: "ABSENT_JUSTIFIED",
        notes: notes || null,
        actorUserId,
      },
      update: {
        status: "ABSENT_JUSTIFIED",
        notes: notes || null,
        actorUserId,
      },
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "attendance:mark_absent",
      entityType: "Attendance",
      entityId: sessionId,
      metadata: { studentId, status: "ABSENT_JUSTIFIED", notes },
    });

    return {
      sessionId: upserted.sessionId,
      studentId: upserted.studentId,
      status: upserted.status,
      notes: upserted.notes,
      actorUserId: upserted.actorUserId,
      updatedAt: upserted.updatedAt,
    };
  }

  async markPresent(
    organizationId: string,
    sessionId: string,
    studentId: string,
    actorUserId: string,
  ): Promise<SessionAttendance> {
    const upserted = await this.prisma.client.attendance.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      create: {
        sessionId,
        studentId,
        status: "PRESENT",
        actorUserId,
      },
      update: {
        status: "PRESENT",
        // Se limpia la nota: describia por que el alumno NO iba a ir, y al
        // revertir ya no aplica. Sin esto quedan registros que dicen "Presente"
        // con la nota "no hay quien lo lleve a clase", y asi salen impresos.
        notes: null,
        actorUserId,
      },
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "attendance:mark_present",
      entityType: "Attendance",
      entityId: sessionId,
      metadata: { studentId, status: "PRESENT" },
    });

    return {
      sessionId: upserted.sessionId,
      studentId: upserted.studentId,
      status: upserted.status,
      notes: upserted.notes,
      actorUserId: upserted.actorUserId,
      updatedAt: upserted.updatedAt,
    };
  }

  async getSessionAttendance(sessionId: string): Promise<SessionAttendance[]> {
    const records = await this.prisma.client.attendance.findMany({
      where: { sessionId },
      orderBy: { updatedAt: "desc" },
    });

    return records.map((r) => ({
      sessionId: r.sessionId,
      studentId: r.studentId,
      status: r.status,
      notes: r.notes,
      actorUserId: r.actorUserId,
      updatedAt: r.updatedAt,
    }));
  }

  async getSessionAttendanceForStudents(
    sessionId: string,
    studentIds: string[],
  ): Promise<Map<string, SessionAttendance>> {
    const records = await this.prisma.client.attendance.findMany({
      where: { sessionId, studentId: { in: studentIds } },
    });

    const map = new Map<string, SessionAttendance>();
    for (const r of records) {
      map.set(r.studentId, {
        sessionId: r.sessionId,
        studentId: r.studentId,
        status: r.status,
        notes: r.notes,
        actorUserId: r.actorUserId,
        updatedAt: r.updatedAt,
      });
    }
    return map;
  }
}
