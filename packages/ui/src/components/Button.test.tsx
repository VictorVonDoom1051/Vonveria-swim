import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renderiza el texto y aplica la variante primaria por defecto", () => {
    render(<Button>Guardar</Button>);

    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button.className).toContain("bg-brand-deep");
  });

  it("aplica la clase de la variante secundaria cuando se indica", () => {
    render(<Button variant="secondary">Cancelar</Button>);

    const button = screen.getByRole("button", { name: "Cancelar" });
    expect(button.className).toContain("bg-brand-turquoise");
  });
});
