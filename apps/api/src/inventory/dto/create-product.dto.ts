import { IsDecimal, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ProductCategory } from "@vonveria-swim/database";

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEnum(ProductCategory)
  category!: ProductCategory;

  @IsDecimal({ decimal_digits: "0,2" })
  unitPrice!: string;

  /** Existencia con la que arranca el producto; genera un movimiento PURCHASE. */
  @IsOptional()
  initialStock?: number;
}
