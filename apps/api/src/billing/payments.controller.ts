import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("billing/payments")
export class PaymentsController {
  constructor(@Inject(PaymentsService) private readonly paymentsService: PaymentsService) {}

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Get("students/:studentId")
  listForStudent(@CurrentUser() user: AuthenticatedUser, @Param("studentId") studentId: string) {
    return this.paymentsService.listForStudent(user.organizationId, studentId);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Get(":paymentId/receipt")
  getReceipt(@CurrentUser() user: AuthenticatedUser, @Param("paymentId") paymentId: string) {
    return this.paymentsService.getReceipt(user.organizationId, paymentId);
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Post()
  createPayment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(user.organizationId, user.id, dto);
  }
}
