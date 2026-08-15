import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class ConsumePackageDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
