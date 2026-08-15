import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { ProductsService } from "./products.service";
import { StockService } from "./stock.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CreateStockMovementDto } from "./dto/create-stock-movement.dto";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

@Controller("inventory")
export class ProductsController {
  constructor(
    @Inject(ProductsService) private readonly products: ProductsService,
    @Inject(StockService) private readonly stock: StockService,
  ) {}

  /**
   * Catalogo para el mostrador: basta sales:manage porque hay que ver que se
   * puede vender y cuanto queda, sin poder modificar nada.
   */
  @RequireCapability(CAPABILITIES.SALES_MANAGE)
  @Get("products")
  list(@CurrentUser() user: AuthenticatedUser, @Query("includeInactive") includeInactive?: string) {
    return this.products.listWithStock(user.organizationId, includeInactive !== "true");
  }

  @RequireCapability(CAPABILITIES.INVENTORY_MANAGE)
  @Post("products")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductDto) {
    return this.products.create(user.organizationId, user.id, dto);
  }

  @RequireCapability(CAPABILITIES.INVENTORY_MANAGE)
  @Patch("products/:id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(user.organizationId, user.id, id, dto);
  }

  @RequireCapability(CAPABILITIES.INVENTORY_MANAGE)
  @Get("products/:id/movements")
  listMovements(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.products.listMovements(user.organizationId, id);
  }

  @RequireCapability(CAPABILITIES.INVENTORY_MANAGE)
  @Post("products/:id/movements")
  registerMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.stock.registerMovement(user.organizationId, user.id, id, dto);
  }
}
