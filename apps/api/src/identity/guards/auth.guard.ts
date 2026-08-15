import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { hashSessionToken, isSessionExpired } from "@vonveria-swim/auth";
import { PrismaService } from "../../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SESSION_COOKIE_NAME } from "../constants";
import type { AuthenticatedUser } from "../types";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();

    if (isPublic) {
      return true;
    }

    const token = request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new UnauthorizedException({ errorCode: "AUTH_SESSION_MISSING" });
    }

    const tokenHash = hashSessionToken(token);
    const session = await this.prisma.client.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: { role: { include: { permissions: { include: { permission: true } } } } },
            },
          },
        },
      },
    });

    if (
      !session ||
      isSessionExpired(session.expiresAt) ||
      session.user.deletedAt ||
      session.user.status !== "ACTIVE"
    ) {
      throw new UnauthorizedException({ errorCode: "AUTH_SESSION_INVALID" });
    }

    const roleKeys = session.user.roles.map((userRole) => userRole.role.key);
    const capabilities = Array.from(
      new Set(
        session.user.roles.flatMap((userRole) =>
          userRole.role.permissions.map((rolePermission) => rolePermission.permission.key),
        ),
      ),
    );

    request.user = {
      id: session.user.id,
      organizationId: session.user.organizationId,
      email: session.user.email,
      fullName: session.user.fullName,
      roleKeys,
      capabilities,
    };

    return true;
  }
}
