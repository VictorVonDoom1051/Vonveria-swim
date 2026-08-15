import { IsDecimal, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class SellPackageDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  totalUnits!: number;

  @IsInt()
  @Min(1)
  @Max(730)
  validDays!: number;

  @IsDecimal({ decimal_digits: "0,2" })
  amount!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
