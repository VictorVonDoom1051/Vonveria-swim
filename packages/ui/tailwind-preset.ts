import type { Config } from "tailwindcss";
import { colors, typography, radii } from "./src/tokens";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // var() con fallback: el color real por defecto viene de packages/ui/src/tokens.ts,
        // pero cualquier organizacion puede sobreescribirlo en runtime con --color-brand-*
        // (ver apps/web/app/layout.tsx) sin reconstruir el CSS. Seccion 6 de CLAUDE.md.
        "brand-deep": `var(--color-brand-deep, ${colors.brand.deep})`,
        "brand-deep-dark": `var(--color-brand-deep-dark, ${colors.brand.deepDark})`,
        "brand-turquoise": `var(--color-brand-turquoise, ${colors.brand.turquoise})`,
        "brand-turquoise-light": `var(--color-brand-turquoise-light, ${colors.brand.turquoiseLight})`,
        "bg-base": colors.background.base,
        "bg-surface": colors.background.surface,
        "text-primary": colors.text.primary,
        "text-secondary": colors.text.secondary,
        "text-inverse": colors.text.inverse,
        "status-success": colors.status.success,
        "status-attention": colors.status.attention,
        "status-debt": colors.status.debt,
        "status-error": colors.status.error,
        "border-subtle": colors.border.subtle,
      },
      fontFamily: {
        sans: [...typography.fontFamily.sans],
      },
      borderRadius: {
        sm: radii.sm,
        md: radii.md,
        lg: radii.lg,
        xl: radii.xl,
      },
    },
  },
};

export default preset;
