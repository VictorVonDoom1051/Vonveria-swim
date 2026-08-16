/**
 * Excel en Windows abre un CSV UTF-8 sin BOM interpretandolo como ANSI, y
 * "Garcia" con acento sale como "GarcÃ­a". El BOM es la diferencia entre un
 * archivo usable y uno que el usuario cree corrupto.
 */
const UTF8_BOM = "﻿";

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  // Comillas, comas y saltos de linea obligan a entrecomillar el campo; las
  // comillas internas se duplican (RFC 4180).
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function buildCsv(headers: readonly string[], rows: readonly unknown[][]): string {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];
  return UTF8_BOM + lines.join("\r\n");
}

export function formatDateForCsv(value: Date | null | undefined): string {
  return value ? value.toLocaleDateString("es-MX") : "";
}

export function formatDateTimeForCsv(value: Date | null | undefined): string {
  return value ? value.toLocaleString("es-MX") : "";
}
