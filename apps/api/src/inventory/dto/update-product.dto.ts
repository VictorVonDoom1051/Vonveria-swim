import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ProductCategory } from "@vonveria-swim/database";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsDecimal({ decimal_digits: "0,2" })
  unitPrice?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
