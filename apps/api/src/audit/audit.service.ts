import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";

export interface RecordAuditEntryInput {
  organizationId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  reason?: string | null;
}

export interface ListAuditParams {
  page: number;
  pageSize: number;
}

@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async record(input: RecordAuditEntryInput): Promise<void> {
    await this.prisma.client.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        reason: input.reason ?? null,
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      },
    });
  }

  async list(organizationId: string, { page, pageSize }: ListAuditParams) {
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.auditLog.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { id: true, fullName: true, email: true } } },
      }),
      this.prisma.client.auditLog.count({ where: { organizationId } }),
    ]);

    return { items, total, page, pageSize };
  }
}
