import { IsDateString, IsDecimal, IsEnum, IsOptional, IsUUID } from "class-validator";
import { PaymentMethod } from "@vonveria-swim/database";

export class CreatePaymentDto {
  @IsUUID()
  studentId!: string;

  @IsDecimal({ decimal_digits: "0,2" })
  amount!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
