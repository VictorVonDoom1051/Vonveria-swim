import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { PackagesService } from "./packages.service";
import { SellPackageDto } from "./dto/sell-package.dto";
import { ConsumePackageDto } from "./dto/consume-package.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("billing/packages")
export class PackagesController {
  constructor(@Inject(PackagesService) private readonly packagesService: PackagesService) {}

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Get("students/:studentId")
  listForStudent(@CurrentUser() user: AuthenticatedUser, @Param("studentId") studentId: string) {
    return this.packagesService.listForStudent(user.organizationId, studentId);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Post()
  sellPackage(@CurrentUser() user: AuthenticatedUser, @Body() dto: SellPackageDto) {
    return this.packagesService.sellPackage(user.organizationId, user.id, dto);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Post(":packageCreditId/consume")
  consumeUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param("packageCreditId") packageCreditId: string,
    @Body() dto: ConsumePackageDto,
  ) {
    return this.packagesService.consumeUnit(user.organizationId, user.id, packageCreditId, dto);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Post(":packageCreditId/return")
  returnUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param("packageCreditId") packageCreditId: string,
    @Body() dto: ConsumePackageDto,
  ) {
    return this.packagesService.returnUnit(user.organizationId, user.id, packageCreditId, dto);
  }
}
