import { Controller, Get, Inject } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { DashboardService } from "./dashboard.service";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("dashboard")
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboard: DashboardService) {}

  /** El instructor no entra aqui: su pantalla es /hoy, con sus propias clases. */
  @RequireCapability(CAPABILITIES.STUDENTS_MANAGE)
  @Get("today")
  getToday(@CurrentUser() user: AuthenticatedUser) {
    const includeBilling = user.capabilities.includes(CAPABILITIES.BILLING_MANAGE);
    return this.dashboard.getToday(user.organizationId, includeBilling);
  }
}
