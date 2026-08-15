import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { StockService } from "./stock.service";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [ProductsController, SalesController],
  providers: [ProductsService, StockService, SalesService],
})
export class InventoryModule {}
