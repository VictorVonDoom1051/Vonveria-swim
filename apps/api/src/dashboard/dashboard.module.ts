import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  // BillingModule exporta ChargesService, que ya calcula el saldo de cada cargo.
  imports: [BillingModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
