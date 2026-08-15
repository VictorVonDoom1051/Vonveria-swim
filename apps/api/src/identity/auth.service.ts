import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import {
  generateSessionToken,
  hashSessionToken,
  sessionExpiryFromNow,
  verifyPassword,
} from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { AuthenticatedUser } from "./types";

export interface LoginContext {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

export interface LoginResult {
  token: string;
  expiresAt: Date;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, context: LoginContext): Promise<LoginResult> {
    const user = await this.prisma.client.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException({ errorCode: "AUTH_INVALID_CREDENTIALS" });
    }

    const validPassword = await verifyPassword(user.passwordHash, password);
    if (!validPassword) {
      throw new UnauthorizedException({ errorCode: "AUTH_INVALID_CREDENTIALS" });
    }

    const { token, tokenHash } = generateSessionToken();
    const expiresAt = sessionExpiryFromNow();

    await this.prisma.client.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        userAgent: context.userAgent ?? null,
        ipAddress: context.ipAddress ?? null,
      },
    });

    const roleKeys = user.roles.map((userRole) => userRole.role.key);
    const capabilities = Array.from(
      new Set(
        user.roles.flatMap((userRole) =>
          userRole.role.permissions.map((rolePermission) => rolePermission.permission.key),
        ),
      ),
    );

    await this.audit.record({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "auth.login",
      entityType: "User",
      entityId: user.id,
    });

    return {
      token,
      expiresAt,
      user: {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        fullName: user.fullName,
        roleKeys,
        capabilities,
      },
    };
  }

  async logout(token: string): Promise<void> {
    const tokenHash = hashSessionToken(token);
    const session = await this.prisma.client.session.findUnique({ where: { tokenHash } });
    if (!session) {
      return;
    }

    await this.prisma.client.session.delete({ where: { id: session.id } });

    const user = await this.prisma.client.user.findUnique({ where: { id: session.userId } });
    if (user) {
      await this.audit.record({
        organizationId: user.organizationId,
        actorUserId: user.id,
        action: "auth.logout",
        entityType: "User",
        entityId: user.id,
      });
    }
  }
}
