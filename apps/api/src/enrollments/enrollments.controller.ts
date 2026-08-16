import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { EnrollmentsService } from "./enrollments.service";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { EnrollWizardDto } from "./dto/enroll-wizard.dto";
import { UpdateEnrollmentStatusDto } from "./dto/update-enrollment-status.dto";
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

  @Get("defaults")
  defaults(@CurrentUser() user: AuthenticatedUser) {
    return this.enrollmentsService.getEnrollmentDefaults(user.organizationId);
  }

  @Get("enrollment-fee-status")
  enrollmentFeeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Query("studentId") studentId: string,
  ) {
    return this.enrollmentsService.getEnrollmentFeeStatus(user.organizationId, studentId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.createEnrollment(user.organizationId, user.id, dto);
  }

  /** Alta completa desde el asistente: familia, alumno e inscripcion en una transaccion. */
  @Post("wizard")
  wizard(@CurrentUser() user: AuthenticatedUser, @Body() dto: EnrollWizardDto) {
    return this.enrollmentsService.enrollFromWizard(user.organizationId, user.id, dto);
  }

  /** Cambiar estado: baja (CANCELLED), pausa (FROZEN), cambio de grupo (TRANSFERRED). */
  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") enrollmentId: string,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    return this.enrollmentsService.updateEnrollmentStatus(
      user.organizationId,
      enrollmentId,
      dto.toStatus,
      dto.reason,
      dto.description,
      user.id,
    );
  }
}
