import { Inject, Injectable } from "@nestjs/common";
import { generateTemporaryPassword, hashPassword } from "@vonveria-swim/auth";
import { RoleKey } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  list(organizationId: string) {
    return this.prisma.client.user.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
        roles: { select: { role: { select: { key: true, name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /** Usado al armar grupos (scheduling:manage no implica users:manage). */
  listInstructors(organizationId: string) {
    return this.prisma.client.user.findMany({
      where: {
        organizationId,
        deletedAt: null,
        roles: { some: { role: { key: RoleKey.INSTRUCTOR } } },
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    });
  }

  async create(organizationId: string, actorUserId: string, dto: CreateUserDto) {
    const role = await this.prisma.client.role.findUniqueOrThrow({
      where: { organizationId_key: { organizationId, key: dto.roleKey } },
    });

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    const user = await this.prisma.client.user.create({
      data: {
        organizationId,
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        roles: { create: { roleId: role.id } },
      },
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "users.create",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email, roleKey: dto.roleKey },
    });

    return { id: user.id, email: user.email, fullName: user.fullName, temporaryPassword };
  }

  async resetPassword(organizationId: string, actorUserId: string, userId: string) {
    const user = await this.prisma.client.user.findFirstOrThrow({
      where: { id: userId, organizationId, deletedAt: null },
    });

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    await this.prisma.client.user.update({ where: { id: user.id }, data: { passwordHash } });
    await this.prisma.client.session.deleteMany({ where: { userId: user.id } });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "users.reset_password",
      entityType: "User",
      entityId: user.id,
    });

    return { temporaryPassword };
  }
}
