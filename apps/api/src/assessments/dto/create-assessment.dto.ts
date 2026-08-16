import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateAssessmentDto {
  @IsUUID()
  studentId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  observation!: string;

  /** Sugerencia registrada: no mueve al alumno de grupo por si sola. */
  @IsOptional()
  @IsUUID()
  suggestedLevelId?: string;
}
