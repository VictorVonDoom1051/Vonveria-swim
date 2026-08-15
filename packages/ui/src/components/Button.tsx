import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-deep text-text-inverse hover:bg-brand-deep-dark",
  secondary: "bg-brand-turquoise text-text-inverse hover:opacity-90",
  ghost: "bg-transparent text-brand-deep border border-border-subtle hover:bg-bg-base",
};

export function Button({ variant = "primary", className, children, ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium " +
    "transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "focus-visible:outline-brand-turquoise";

  const classes = [base, variantClasses[variant], className].filter(Boolean).join(" ");

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
