import { Controller, Get, Inject, Query } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { AuditService } from "./audit.service";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("audit")
@RequireCapability(CAPABILITIES.AUDIT_VIEW)
export class AuditController {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.auditService.list(user.organizationId, {
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(100, Math.max(1, Number(pageSize) || 25)),
    });
  }
}
