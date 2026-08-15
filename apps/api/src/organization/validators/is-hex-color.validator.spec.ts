import { describe, expect, it } from "vitest";
import { validate } from "class-validator";
import { IsHexColor } from "./is-hex-color.validator";

class ColorDto {
  @IsHexColor()
  color!: string;
}

describe("IsHexColor (decorador de class-validator)", () => {
  it("no reporta errores con un color hex valido", async () => {
    const dto = new ColorDto();
    dto.color = "#0B3C5D";

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("reporta un error con un valor que no es un color hex", async () => {
    const dto = new ColorDto();
    dto.color = "red; } body { display:none } /*";

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isHexColor).toBeDefined();
  });
});
