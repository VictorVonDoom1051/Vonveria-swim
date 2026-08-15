import { IsDecimal, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

/** amount puede ser negativo (descuento) o positivo (correccion al alza). */
export class CreateAdjustmentDto {
  @IsUUID()
  chargeId!: string;

  @IsDecimal({ decimal_digits: "0,2" })
  amount!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}
