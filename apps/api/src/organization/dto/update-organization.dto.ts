import { IsDecimal, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  /**
   * Montos sugeridos al inscribir. Existen para que "forzoso" sea confiable:
   * si recepcion teclea la anualidad de memoria en cada alta, un dedazo se
   * vuelve un cargo equivocado.
   */
  @IsOptional()
  @IsDecimal({ decimal_digits: "0,2" })
  defaultEnrollmentFee?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: "0,2" })
  defaultAnnualFee?: string;
}
