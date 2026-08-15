import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from "class-validator";
import { BillingModality } from "@vonveria-swim/database";

export class CreateEnrollmentDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  groupId!: string;

  @IsDateString()
  startDate!: string;

  /** Seccion 13: la inscripcion activa define la modalidad de cobro. Sin valor: NONE. */
  @IsOptional()
  @IsEnum(BillingModality)
  billingModality?: BillingModality;

  /** Cargo unico opcional al inscribir, independiente de la modalidad recurrente. */
  @IsOptional()
  @IsDecimal({ decimal_digits: "0,2" })
  enrollmentFeeAmount?: string;

  @ValidateIf((dto: CreateEnrollmentDto) => dto.billingModality === "MONTHLY")
  @IsDecimal({ decimal_digits: "0,2" })
  monthlyRateAmount?: string;

  @ValidateIf((dto: CreateEnrollmentDto) => dto.billingModality === "MONTHLY")
  @IsInt()
  @Min(1)
  @Max(28)
  monthlyDueDay?: number;
}
