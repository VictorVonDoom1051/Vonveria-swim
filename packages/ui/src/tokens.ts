/**
 * Design tokens de VonverIA Swim (Seccion 6 de CLAUDE.md).
 * No se codifican colores directamente en componentes de negocio:
 * todo consumidor debe importar estos tokens o el preset de Tailwind.
 */
export const colors = {
  brand: {
    deep: "#0B3C5D",
    deepDark: "#082C44",
    turquoise: "#1FB6A6",
    turquoiseLight: "#5FD3C4",
  },
  background: {
    base: "#F7FAFC",
    surface: "#FFFFFF",
  },
  text: {
    primary: "#0F2733",
    secondary: "#4A6572",
    inverse: "#FFFFFF",
  },
  status: {
    success: "#16A34A",
    attention: "#D97706",
    debt: "#EA580C",
    error: "#DC2626",
  },
  border: {
    subtle: "#E2E8F0",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      "Arial",
      "sans-serif",
    ],
  },
} as const;

export const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
} as const;
