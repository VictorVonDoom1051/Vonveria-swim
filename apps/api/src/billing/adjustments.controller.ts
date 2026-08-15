import { Body, Controller, Inject, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { AdjustmentsService } from "./adjustments.service";
import { RefundsService } from "./refunds.service";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";
import { CreateRefundDto } from "./dto/create-refund.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("billing")
export class AdjustmentsController {
  constructor(
    @Inject(AdjustmentsService) private readonly adjustmentsService: AdjustmentsService,
    @Inject(RefundsService) private readonly refundsService: RefundsService,
  ) {}

  @RequireCapability(CAPABILITIES.BILLING_ADJUST)
  @Post("adjustments")
  createAdjustment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAdjustmentDto) {
    return this.adjustmentsService.createAdjustment(user.organizationId, user.id, dto);
  }

  @RequireCapability(CAPABILITIES.BILLING_ADJUST)
  @Post("refunds")
  createRefund(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRefundDto) {
    return this.refundsService.createRefund(user.organizationId, user.id, dto);
  }
}
