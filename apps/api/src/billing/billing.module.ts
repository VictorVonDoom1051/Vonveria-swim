import { Module } from "@nestjs/common";
import { ChargesController } from "./charges.controller";
import { ChargesService } from "./charges.service";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { AdjustmentsController } from "./adjustments.controller";
import { AdjustmentsService } from "./adjustments.service";
import { RefundsService } from "./refunds.service";
import { PackagesController } from "./packages.controller";
import { PackagesService } from "./packages.service";
import { CashClosingController } from "./cash-closing.controller";
import { CashClosingService } from "./cash-closing.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [
    ChargesController,
    PaymentsController,
    AdjustmentsController,
    PackagesController,
    CashClosingController,
  ],
  providers: [
    ChargesService,
    PaymentsService,
    AdjustmentsService,
    RefundsService,
    PackagesService,
    CashClosingService,
  ],
  exports: [ChargesService],
})
export class BillingModule {}
