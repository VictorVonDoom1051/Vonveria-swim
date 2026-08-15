import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { ChargesService } from "./charges.service";
import { CreateChargeDto } from "./dto/create-charge.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("billing/charges")
export class ChargesController {
  constructor(@Inject(ChargesService) private readonly chargesService: ChargesService) {}

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Get("pending")
  listPending(@CurrentUser() user: AuthenticatedUser) {
    return this.chargesService.listPending(user.organizationId);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Get("students/:studentId")
  listForStudent(@CurrentUser() user: AuthenticatedUser, @Param("studentId") studentId: string) {
    return this.chargesService.listForStudent(user.organizationId, studentId);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Post()
  createManualCharge(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateChargeDto) {
    return this.chargesService.createManualCharge(user.organizationId, user.id, dto);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Post(":chargeId/cancel")
  cancelCharge(@CurrentUser() user: AuthenticatedUser, @Param("chargeId") chargeId: string) {
    return this.chargesService.cancelCharge(user.organizationId, user.id, chargeId);
  }
}
