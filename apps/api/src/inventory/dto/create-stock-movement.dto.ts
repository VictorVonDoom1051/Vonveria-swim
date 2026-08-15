import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  NotEquals,
} from "class-validator";
import { StockMovementReason } from "@vonveria-swim/database";

/**
 * Solo entradas de mercancia y ajustes se registran a mano. Los movimientos de
 * tipo SALE los crea SalesService dentro de la transaccion de la venta.
 */
export class CreateStockMovementDto {
  @IsInt()
  @NotEquals(0)
  delta!: number;

  @IsIn([StockMovementReason.PURCHASE, StockMovementReason.ADJUSTMENT, StockMovementReason.RETURN])
  reason!: Exclude<StockMovementReason, typeof StockMovementReason.SALE>;

  /** Obligatorio en ajustes: un ajuste sin motivo es por donde se pierde mercancia sin rastro. */
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  notes?: string;
}
