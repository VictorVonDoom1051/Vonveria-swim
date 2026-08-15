const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Valida que un color de marca sea un hex valido antes de guardarlo o de
 * inyectarlo como variable CSS (Seccion 15: validar entrada en los limites
 * del sistema). Sin esto, un valor de color mal formado podria romper la
 * hoja de estilos generada dinamicamente por organizacion.
 */
export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}
