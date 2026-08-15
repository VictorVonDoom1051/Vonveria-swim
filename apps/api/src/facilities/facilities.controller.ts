import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { FacilitiesService } from "./facilities.service";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { CreatePoolDto } from "./dto/create-pool.dto";
import { CreateLaneDto } from "./dto/create-lane.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("facilities")
export class FacilitiesController {
  constructor(@Inject(FacilitiesService) private readonly facilitiesService: FacilitiesService) {}

  /** Lectura: tambien la necesita Recepcion para armar grupos (scheduling:manage). */
  @RequireCapability(CAPABILITIES.CATALOG_MANAGE, CAPABILITIES.SCHEDULING_MANAGE)
  @Get("branches")
  listBranches(@CurrentUser() user: AuthenticatedUser) {
    return this.facilitiesService.listBranches(user.organizationId);
  }

  @RequireCapability(CAPABILITIES.CATALOG_MANAGE)
  @Post("branches")
  createBranch(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBranchDto) {
    return this.facilitiesService.createBranch(user.organizationId, user.id, dto.name);
  }

  @RequireCapability(CAPABILITIES.CATALOG_MANAGE)
  @Post("branches/:branchId/pools")
  createPool(
    @CurrentUser() user: AuthenticatedUser,
    @Param("branchId") branchId: string,
    @Body() dto: CreatePoolDto,
  ) {
    return this.facilitiesService.createPool(user.organizationId, user.id, branchId, dto.name);
  }

  @RequireCapability(CAPABILITIES.CATALOG_MANAGE)
  @Post("pools/:poolId/lanes")
  createLane(
    @CurrentUser() user: AuthenticatedUser,
    @Param("poolId") poolId: string,
    @Body() dto: CreateLaneDto,
  ) {
    return this.facilitiesService.createLane(user.organizationId, user.id, poolId, dto.name);
  }
}
