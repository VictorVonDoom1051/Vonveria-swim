import { IsDateString, IsDecimal, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { ChargeType } from "@vonveria-swim/database";

/** Solo para cargos manuales (clase individual u otro concepto configurable). */
export class CreateChargeDto {
  @IsUUID()
  studentId!: string;

  /** El servicio solo acepta SINGLE_CLASS u OTHER aqui; el resto tiene su propio flujo. */
  @IsEnum(ChargeType)
  type!: ChargeType;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  description!: string;

  @IsDecimal({ decimal_digits: "0,2" })
  amount!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
