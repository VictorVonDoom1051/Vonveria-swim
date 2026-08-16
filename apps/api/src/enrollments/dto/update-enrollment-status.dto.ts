import { IsEnum, IsString, IsOptional } from "class-validator";

export enum EnrollmentStatusEnum {
  ACTIVE = "ACTIVE",
  TRANSFERRED = "TRANSFERRED",
  CANCELLED = "CANCELLED",
  FROZEN = "FROZEN",
}

export class UpdateEnrollmentStatusDto {
  @IsEnum(EnrollmentStatusEnum)
  toStatus!: EnrollmentStatusEnum;

  @IsString()
  reason!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
