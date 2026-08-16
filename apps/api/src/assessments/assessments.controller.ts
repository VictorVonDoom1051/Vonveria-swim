import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { AssessmentsService } from "./assessments.service";
import { CreateAssessmentDto } from "./dto/create-assessment.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("assessments")
export class AssessmentsController {
  constructor(@Inject(AssessmentsService) private readonly assessments: AssessmentsService) {}

  /**
   * Quien administra alumnos ve todas las evaluaciones; un instructor solo las de
   * sus propios alumnos. Se deriva de la capacidad, no del rol.
   */
  private seesAll(user: AuthenticatedUser): boolean {
    return user.capabilities.includes(CAPABILITIES.STUDENTS_MANAGE);
  }

  @RequireCapability(CAPABILITIES.ASSESSMENTS_MANAGE)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.assessments.list(user.organizationId, user.id, this.seesAll(user));
  }

  @RequireCapability(CAPABILITIES.ASSESSMENTS_MANAGE)
  @Get("students")
  listStudents(@CurrentUser() user: AuthenticatedUser) {
    return this.assessments.listAssessableStudents(
      user.organizationId,
      user.id,
      this.seesAll(user),
    );
  }

  @RequireCapability(CAPABILITIES.ASSESSMENTS_MANAGE)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAssessmentDto) {
    return this.assessments.create(user.organizationId, user.id, this.seesAll(user), dto);
  }
}
