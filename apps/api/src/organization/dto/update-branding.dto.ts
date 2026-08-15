import { IsOptional, IsUrl } from "class-validator";
import { IsHexColor } from "../validators/is-hex-color.validator";

export class UpdateBrandingDto {
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  faviconUrl?: string;
}
