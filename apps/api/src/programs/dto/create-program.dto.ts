import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";
import { ProgramType } from "@vonveria-swim/database";

export class CreateProgramDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEnum(ProgramType)
  type!: ProgramType;
}
