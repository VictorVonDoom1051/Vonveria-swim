import type { HTMLAttributes, ReactNode } from "react";

export type StatusTone = "success" | "attention" | "debt" | "error";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
  children: ReactNode;
}

const toneClasses: Record<StatusTone, string> = {
  success: "bg-status-success/10 text-status-success",
  attention: "bg-status-attention/10 text-status-attention",
  debt: "bg-status-debt/10 text-status-debt",
  error: "bg-status-error/10 text-status-error",
};

/** Estado consistente para exito, atencion, deuda y error (Seccion 6 de CLAUDE.md). */
export function StatusBadge({ tone, className, children, ...rest }: StatusBadgeProps) {
  const classes = [
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    toneClasses[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
