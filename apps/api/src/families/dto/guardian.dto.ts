import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class GuardianDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
