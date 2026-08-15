import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
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
import { ScheduleRuleDto } from "./schedule-rule.dto";

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsUUID()
  programId!: string;

  @IsUUID()
  levelId!: string;

  @IsUUID()
  branchId!: string;

  @IsUUID()
  poolId!: string;

  @IsOptional()
  @IsUUID()
  laneId?: string;

  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @IsInt()
  @Min(1)
  @Max(200)
  capacity!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScheduleRuleDto)
  scheduleRules!: ScheduleRuleDto[];
}
