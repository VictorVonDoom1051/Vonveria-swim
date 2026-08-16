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

  /** Obligatoria: la escuela cobra anualidad en toda inscripcion. */
  @IsDecimal({ decimal_digits: "0,2" })
  annualFeeAmount!: string;

  /**
   * Cargo unico al inscribir. El servicio lo omite si el alumno ya pago
   * inscripcion alguna vez, aunque venga en la peticion.
   */
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
