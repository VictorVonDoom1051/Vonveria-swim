import { Type } from "class-transformer";
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { BillingModality } from "@vonveria-swim/database";

export class NewGuardianDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;
}

export class NewStudentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  fullName!: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  medicalAlerts?: string;
}

/**
 * Inscripcion completa en un solo paso: familia, alumno e inscripcion.
 *
 * Familia y alumno se pueden dar por id (ya existen) o por payload (se crean).
 * Todo ocurre en una transaccion para que un fallo no deje una familia huerfana.
 */
export class EnrollWizardDto {
  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewGuardianDto)
  newGuardian?: NewGuardianDto;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewStudentDto)
  newStudent?: NewStudentDto;

  @IsUUID()
  groupId!: string;

  @IsDateString()
  startDate!: string;

  /** Obligatoria: la escuela la cobra en toda inscripcion. */
  @IsDecimal({ decimal_digits: "0,2" })
  annualFeeAmount!: string;

  /**
   * Solo se cobra si el alumno nunca la ha pagado. El servicio lo verifica y la
   * ignora si ya existe, sin importar lo que llegue aqui.
   */
  @IsOptional()
  @IsDecimal({ decimal_digits: "0,2" })
  enrollmentFeeAmount?: string;

  @IsOptional()
  @IsEnum(BillingModality)
  billingModality?: BillingModality;

  @IsOptional()
  @IsDecimal({ decimal_digits: "0,2" })
  monthlyRateAmount?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  monthlyDueDay?: number;
}
