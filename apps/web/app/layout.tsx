import type { CSSProperties } from "react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getPublicBranding } from "../lib/branding";

export const metadata: Metadata = {
  title: "VonverIA Swim",
  description: "Plataforma para administrar escuelas de natacion",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const publicBranding = await getPublicBranding();
  const branding = publicBranding?.branding;

  const brandStyle: CSSProperties | undefined = branding
    ? ({
        "--color-brand-deep": branding.primaryColor,
        "--color-brand-turquoise": branding.accentColor,
      } as CSSProperties)
    : undefined;

  return (
    <html lang="es">
      <body style={brandStyle}>{children}</body>
    </html>
  );
}
