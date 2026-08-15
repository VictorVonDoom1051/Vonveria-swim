import { Controller, Get, Inject, Query } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { ReportsService } from "./reports.service";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

const DEFAULT_RANGE_DAYS = 30;

@Controller("reports")
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reportsService: ReportsService) {}

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Get("billing-summary")
  getBillingSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query("from") fromParam?: string,
    @Query("to") toParam?: string,
  ) {
    const to = toParam ? new Date(toParam) : new Date();
    const from = fromParam
      ? new Date(fromParam)
      : new Date(to.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);
    return this.reportsService.getBillingSummary(user.organizationId, from, to);
  }
}
