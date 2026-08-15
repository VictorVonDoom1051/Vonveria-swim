import { Inject, Injectable } from "@nestjs/common";
import { ProgramType } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class ProgramsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  listPrograms(organizationId: string) {
    return this.prisma.client.program.findMany({
      where: { organizationId },
      include: { levels: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    });
  }

  async createProgram(
    organizationId: string,
    actorUserId: string,
    name: string,
    type: ProgramType,
  ) {
    const program = await this.prisma.client.program.create({
      data: { organizationId, name, type },
    });
    await this.audit.record({
      organizationId,
      actorUserId,
      action: "programs.program_create",
      entityType: "Program",
      entityId: program.id,
    });
    return program;
  }

  async createLevel(
    organizationId: string,
    actorUserId: string,
    programId: string,
    name: string,
    sortOrder: number,
  ) {
    await this.prisma.client.program.findFirstOrThrow({ where: { id: programId, organizationId } });
    const level = await this.prisma.client.level.create({ data: { programId, name, sortOrder } });
    await this.audit.record({
      organizationId,
      actorUserId,
      action: "programs.level_create",
      entityType: "Level",
      entityId: level.id,
    });
    return level;
  }
}
