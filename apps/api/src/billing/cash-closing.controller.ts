import { Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { CashClosingService } from "./cash-closing.service";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("billing/cash-closings")
export class CashClosingController {
  constructor(@Inject(CashClosingService) private readonly cashClosingService: CashClosingService) {}

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.cashClosingService.list(user.organizationId);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Get("open-summary")
  getOpenSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.cashClosingService.getOpenSummary(user.organizationId);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Get(":id/detail")
  getClosingDetail(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.cashClosingService.getClosingDetail(user.organizationId, id);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Post()
  closeCash(@CurrentUser() user: AuthenticatedUser) {
    return this.cashClosingService.closeCash(user.organizationId, user.id);
  }
}
