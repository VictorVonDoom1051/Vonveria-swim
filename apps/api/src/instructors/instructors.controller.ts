import { Controller, Get, Inject } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { InstructorsService } from "./instructors.service";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("instructors")
export class InstructorsController {
  constructor(@Inject(InstructorsService) private readonly instructors: InstructorsService) {}

  @RequireCapability(CAPABILITIES.SCHEDULING_MANAGE)
  @Get("overview")
  listOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.instructors.listOverview(user.organizationId);
  }
}
