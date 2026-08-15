import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsPositive,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PaymentMethod } from "@vonveria-swim/database";

export class SaleLineDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}

export class CreateSaleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleLineDto)
  lines!: SaleLineDto[];

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}
