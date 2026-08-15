import { Body, Controller, Get, Inject, Patch } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { OrganizationService } from "./organization.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { UpdateBrandingDto } from "./dto/update-branding.dto";
import { Public } from "../identity/decorators/public.decorator";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("organization")
export class OrganizationController {
  constructor(
    @Inject(OrganizationService) private readonly organizationService: OrganizationService,
  ) {}

  /** Publico: hasta el login necesita mostrar el nombre/logo/colores de la escuela. */
  @Public()
  @Get("branding")
  getPublicBranding() {
    return this.organizationService.getPublicBranding();
  }

  @RequireCapability(CAPABILITIES.ORGANIZATION_MANAGE)
  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationService.getForOrganization(user.organizationId);
  }

  @RequireCapability(CAPABILITIES.ORGANIZATION_MANAGE)
  @Patch()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateOrganizationDto) {
    return this.organizationService.update(user.organizationId, user.id, dto);
  }

  @RequireCapability(CAPABILITIES.ORGANIZATION_MANAGE)
  @Patch("branding")
  updateBranding(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateBrandingDto) {
    return this.organizationService.updateBranding(user.organizationId, user.id, dto);
  }
}
