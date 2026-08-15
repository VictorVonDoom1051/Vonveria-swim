import { CAPABILITIES, type Capability } from "@vonveria-swim/permissions";

export interface NavItem {
  label: string;
  href: string;
  /** Si se define, el item solo aparece si el usuario tiene al menos una de estas capacidades. */
  requiresAnyCapability?: Capability[];
}

/** Seccion 5 de CLAUDE.md: navegacion de Direccion y Recepcion (maximo 6 secciones). */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Inicio", href: "/inicio" },
  { label: "Alumnos", href: "/alumnos" },
  { label: "Clases", href: "/clases" },
  { label: "Asistencia", href: "/asistencia" },
  { label: "Pagos", href: "/pagos" },
];

export const MORE_NAV: NavItem[] = [
  { label: "Instructores", href: "/instructores" },
  { label: "Evaluaciones", href: "/evaluaciones" },
  { label: "Reportes", href: "/reportes" },
  {
    label: "Instalaciones",
    href: "/settings/facilities",
    requiresAnyCapability: [CAPABILITIES.CATALOG_MANAGE],
  },
  {
    label: "Programas",
    href: "/settings/programs",
    requiresAnyCapability: [CAPABILITIES.CATALOG_MANAGE],
  },
  {
    label: "Configuracion",
    href: "/settings/organization",
    requiresAnyCapability: [
      CAPABILITIES.ORGANIZATION_MANAGE,
      CAPABILITIES.USERS_MANAGE,
      CAPABILITIES.AUDIT_VIEW,
    ],
  },
];

/** Seccion 5 de CLAUDE.md: navegacion movil de Instructor (maximo 3 secciones). */
export const INSTRUCTOR_NAV: NavItem[] = [
  { label: "Hoy", href: "/hoy" },
  { label: "Asistencia", href: "/asistencia" },
  { label: "Evaluaciones", href: "/evaluaciones" },
];

export function filterByCapability(items: NavItem[], capabilities: readonly string[]): NavItem[] {
  return items.filter(
    (item) =>
      !item.requiresAnyCapability ||
      item.requiresAnyCapability.some((capability) => capabilities.includes(capability)),
  );
}
