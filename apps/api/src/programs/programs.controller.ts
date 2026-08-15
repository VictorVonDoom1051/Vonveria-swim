import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { ProgramsService } from "./programs.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { CreateLevelDto } from "./dto/create-level.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("programs")
export class ProgramsController {
  constructor(@Inject(ProgramsService) private readonly programsService: ProgramsService) {}

  @RequireCapability(CAPABILITIES.CATALOG_MANAGE, CAPABILITIES.SCHEDULING_MANAGE)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.programsService.listPrograms(user.organizationId);
  }

  @RequireCapability(CAPABILITIES.CATALOG_MANAGE)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProgramDto) {
    return this.programsService.createProgram(user.organizationId, user.id, dto.name, dto.type);
  }

  @RequireCapability(CAPABILITIES.CATALOG_MANAGE)
  @Post(":programId/levels")
  createLevel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("programId") programId: string,
    @Body() dto: CreateLevelDto,
  ) {
    return this.programsService.createLevel(
      user.organizationId,
      user.id,
      programId,
      dto.name,
      dto.sortOrder ?? 0,
    );
  }
}
