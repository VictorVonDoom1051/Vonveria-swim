import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { FamiliesService } from "./families.service";
import { CreateFamilyDto } from "./dto/create-family.dto";
import { GuardianDto } from "./dto/guardian.dto";
import { CreateStudentDto } from "./dto/create-student.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller()
@RequireCapability(CAPABILITIES.STUDENTS_MANAGE)
export class FamiliesController {
  constructor(@Inject(FamiliesService) private readonly familiesService: FamiliesService) {}

  @Get("families/search")
  search(@CurrentUser() user: AuthenticatedUser, @Query("q") query = "") {
    return this.familiesService.search(user.organizationId, query);
  }

  @Post("families")
  createFamily(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFamilyDto) {
    return this.familiesService.createFamily(user.organizationId, user.id, dto.guardian);
  }

  @Get("families/:id")
  getFamily(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.familiesService.getFamily(user.organizationId, id);
  }

  @Post("families/:id/guardians")
  addGuardian(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: GuardianDto,
  ) {
    return this.familiesService.addGuardian(user.organizationId, user.id, id, dto);
  }

  @Post("families/:id/students")
  createStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateStudentDto,
  ) {
    return this.familiesService.createStudent(user.organizationId, user.id, id, dto);
  }

  @Get("students/:id")
  getStudent(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.familiesService.getStudent(user.organizationId, id);
  }
}
