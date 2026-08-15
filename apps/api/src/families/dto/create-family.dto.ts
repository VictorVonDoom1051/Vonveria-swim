import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { GuardianDto } from "./guardian.dto";

export class CreateFamilyDto {
  @ValidateNested()
  @Type(() => GuardianDto)
  guardian!: GuardianDto;
}
