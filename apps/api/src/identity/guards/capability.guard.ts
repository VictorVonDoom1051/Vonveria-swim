import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { hasCapability, type Capability } from "@vonveria-swim/permissions";
import { REQUIRE_CAPABILITY_KEY } from "../decorators/require-capability.decorator";
import type { AuthenticatedUser } from "../types";

@Injectable()
export class CapabilityGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Capability[] | undefined>(
      REQUIRE_CAPABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const ok =
      !!request.user &&
      required.some((capability) => hasCapability(request.user!.capabilities, capability));
    if (!ok) {
      throw new ForbiddenException({ errorCode: "CAPABILITY_REQUIRED", capability: required });
    }
    return true;
  }
}
