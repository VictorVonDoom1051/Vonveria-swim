import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class FacilitiesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  listBranches(organizationId: string) {
    return this.prisma.client.branch.findMany({
      where: { organizationId },
      include: { pools: { include: { lanes: true }, orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    });
  }

  async createBranch(organizationId: string, actorUserId: string, name: string) {
    const branch = await this.prisma.client.branch.create({ data: { organizationId, name } });
    await this.audit.record({
      organizationId,
      actorUserId,
      action: "facilities.branch_create",
      entityType: "Branch",
      entityId: branch.id,
    });
    return branch;
  }

  async createPool(organizationId: string, actorUserId: string, branchId: string, name: string) {
    await this.prisma.client.branch.findFirstOrThrow({ where: { id: branchId, organizationId } });
    const pool = await this.prisma.client.pool.create({ data: { branchId, name } });
    await this.audit.record({
      organizationId,
      actorUserId,
      action: "facilities.pool_create",
      entityType: "Pool",
      entityId: pool.id,
    });
    return pool;
  }

  async createLane(organizationId: string, actorUserId: string, poolId: string, name: string) {
    await this.prisma.client.pool.findFirstOrThrow({
      where: { id: poolId, branch: { organizationId } },
    });
    const lane = await this.prisma.client.lane.create({ data: { poolId, name } });
    await this.audit.record({
      organizationId,
      actorUserId,
      action: "facilities.lane_create",
      entityType: "Lane",
      entityId: lane.id,
    });
    return lane;
  }
}
