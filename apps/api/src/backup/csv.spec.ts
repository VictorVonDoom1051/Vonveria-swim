import { describe, expect, it } from "vitest";
import { buildCsv } from "./csv";

describe("buildCsv", () => {
  it("empieza con BOM para que Excel respete los acentos", () => {
    const csv = buildCsv(["Alumno"], [["María García"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("María García");
  });

  it("entrecomilla los campos con coma", () => {
    const csv = buildCsv(["Nombre"], [["García, María"]]);
    expect(csv).toContain('"García, María"');
  });

  it("duplica las comillas internas", () => {
    const csv = buildCsv(["Nota"], [['Dijo "no viene"']]);
    expect(csv).toContain('"Dijo ""no viene"""');
  });

  it("entrecomilla un campo con salto de linea", () => {
    const csv = buildCsv(["Nota"], [["Primera\nSegunda"]]);
    expect(csv).toContain('"Primera\nSegunda"');
  });

  it("deja vacios los nulos en vez de escribir null", () => {
    const csv = buildCsv(["A", "B"], [[null, undefined]]);
    expect(csv.endsWith(",")).toBe(true);
    expect(csv).not.toContain("null");
    expect(csv).not.toContain("undefined");
  });

  it("separa renglones con CRLF", () => {
    const csv = buildCsv(["A"], [["1"], ["2"]]);
    expect(csv).toContain("A\r\n1\r\n2");
  });
});
