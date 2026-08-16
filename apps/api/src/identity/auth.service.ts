import { Inject, Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { randomBytes, createHash } from "crypto";
import {
  generateSessionToken,
  hashSessionToken,
  sessionExpiryFromNow,
  verifyPassword,
  hashPassword,
} from "@vonveria-swim/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { MailerService } from "../common/mailer.service";
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
    @Inject(MailerService) private readonly mailer: MailerService,
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

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.client.user.findFirst({
      where: { email, deletedAt: null, status: "ACTIVE" },
    });

    if (!user) {
      return;
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.client.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    await this.mailer.sendPasswordResetEmail(user.email, resetLink);

    await this.audit.record({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "auth.password_reset_requested",
      entityType: "User",
      entityId: user.id,
    });
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new BadRequestException({
        errorCode: "INVALID_PASSWORD",
        message: "Password must be at least 8 characters long",
      });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const resetToken = await this.prisma.client.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException({
        errorCode: "INVALID_RESET_TOKEN",
        message: "Token inválido o expirado",
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.client.$transaction([
      this.prisma.client.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.client.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    await this.audit.record({
      organizationId: resetToken.user.organizationId,
      actorUserId: resetToken.user.id,
      action: "auth.password_reset_completed",
      entityType: "User",
      entityId: resetToken.user.id,
    });
  }
}
