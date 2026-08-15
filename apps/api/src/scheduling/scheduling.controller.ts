import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { SchedulingService } from "./scheduling.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("scheduling")
export class SchedulingController {
  constructor(@Inject(SchedulingService) private readonly schedulingService: SchedulingService) {}

  @RequireCapability(CAPABILITIES.SCHEDULING_MANAGE)
  @Get("groups")
  listGroups(@CurrentUser() user: AuthenticatedUser) {
    return this.schedulingService.listGroups(user.organizationId);
  }

  @RequireCapability(CAPABILITIES.SCHEDULING_MANAGE)
  @Get("groups/:id")
  getGroup(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.schedulingService.getGroup(user.organizationId, id);
  }

  @RequireCapability(CAPABILITIES.SCHEDULING_MANAGE)
  @Post("groups")
  createGroup(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupDto) {
    return this.schedulingService.createGroup(user.organizationId, user.id, dto);
  }

  @RequireCapability(CAPABILITIES.SCHEDULING_MANAGE)
  @Post("groups/:id/publish")
  @HttpCode(HttpStatus.OK)
  publishGroup(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.schedulingService.publishGroup(user.organizationId, user.id, id);
  }

  /** Sin capacidad especial: cualquier usuario autenticado ve sus propias sesiones de hoy. */
  @Get("sessions/today")
  listTodaySessions(@CurrentUser() user: AuthenticatedUser) {
    return this.schedulingService.listTodaySessionsForInstructor(user.id);
  }

  @RequireCapability(CAPABILITIES.SCHEDULING_MANAGE)
  @Get("sessions/upcoming")
  listUpcomingSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.schedulingService.listUpcomingSessionsForOrganization(user.organizationId);
  }
}
