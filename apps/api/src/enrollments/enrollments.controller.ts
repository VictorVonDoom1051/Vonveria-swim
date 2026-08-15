import { Body, Controller, Get, Inject, Post, Query } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { EnrollmentsService } from "./enrollments.service";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("enrollments")
@RequireCapability(CAPABILITIES.STUDENTS_MANAGE)
export class EnrollmentsController {
  constructor(
    @Inject(EnrollmentsService) private readonly enrollmentsService: EnrollmentsService,
  ) {}

  @Get("compatible-groups")
  compatibleGroups(
    @CurrentUser() user: AuthenticatedUser,
    @Query("programId") programId: string,
    @Query("levelId") levelId: string,
  ) {
    return this.enrollmentsService.findCompatibleGroups(user.organizationId, programId, levelId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.createEnrollment(user.organizationId, user.id, dto);
  }
}
