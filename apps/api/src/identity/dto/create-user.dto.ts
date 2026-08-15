import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from "class-validator";
import { RoleKey } from "@vonveria-swim/database";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsEnum(RoleKey)
  roleKey!: RoleKey;
}
