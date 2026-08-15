import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { SalesService } from "./sales.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("inventory/sales")
export class SalesController {
  constructor(@Inject(SalesService) private readonly sales: SalesService) {}

  @RequireCapability(CAPABILITIES.SALES_MANAGE)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.sales.list(user.organizationId);
  }

  @RequireCapability(CAPABILITIES.SALES_MANAGE)
  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.sales.getById(user.organizationId, id);
  }

  @RequireCapability(CAPABILITIES.SALES_MANAGE)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSaleDto) {
    return this.sales.createSale(user.organizationId, user.id, dto);
  }
}
