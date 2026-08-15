import { IsDecimal, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateRefundDto {
  @IsUUID()
  paymentId!: string;

  @IsDecimal({ decimal_digits: "0,2" })
  amount!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}
