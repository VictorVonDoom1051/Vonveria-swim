import { registerDecorator, type ValidationOptions } from "class-validator";
import { isValidHexColor } from "@vonveria-swim/configuration";

/** Envuelve isValidHexColor de packages/configuration como decorador de class-validator. */
export function IsHexColor(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isHexColor",
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      validator: {
        validate(value: unknown) {
          return typeof value === "string" && isValidHexColor(value);
        },
        defaultMessage() {
          return `${propertyName} debe ser un color hexadecimal valido (#RRGGBB)`;
        },
      },
    });
  };
}
