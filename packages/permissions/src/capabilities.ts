/**
 * Catalogo global de capacidades (Seccion 15 de CLAUDE.md: "RBAC basado en
 * capacidades"). Se amplia en cada hito segun el modulo que se construya.
 * No se agregan capacidades especulativas para modulos que todavia no
 * existen (asistencia, evaluaciones, etc.).
 */
export const CAPABILITIES = {
  ORGANIZATION_MANAGE: "organization:manage",
  USERS_MANAGE: "users:manage",
  AUDIT_VIEW: "audit:view",
  // M2: instalaciones/catalogo, familias/alumnos, grupos y horarios.
  CATALOG_MANAGE: "catalog:manage",
  STUDENTS_MANAGE: "students:manage",
  SCHEDULING_MANAGE: "scheduling:manage",
  // M3: cobranza.
  BILLING_MANAGE: "billing:manage",
  BILLING_ADJUST: "billing:adjust",
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export interface CapabilityDefinition {
  key: Capability;
  description: string;
}

/** Usado por el seed para poblar la tabla Permission. */
export const CAPABILITY_CATALOG: readonly CapabilityDefinition[] = [
  { key: CAPABILITIES.ORGANIZATION_MANAGE, description: "Configurar organizacion y marca" },
  { key: CAPABILITIES.USERS_MANAGE, description: "Administrar usuarios y permisos" },
  { key: CAPABILITIES.AUDIT_VIEW, description: "Consultar auditoria" },
  {
    key: CAPABILITIES.CATALOG_MANAGE,
    description: "Configurar sucursales, albercas, carriles, programas y niveles",
  },
  {
    key: CAPABILITIES.STUDENTS_MANAGE,
    description: "Administrar familias, alumnos e inscripciones",
  },
  { key: CAPABILITIES.SCHEDULING_MANAGE, description: "Crear y modificar grupos y horarios" },
  {
    key: CAPABILITIES.BILLING_MANAGE,
    description: "Registrar cargos, pagos, paquetes y corte de caja",
  },
  {
    key: CAPABILITIES.BILLING_ADJUST,
    description: "Aplicar ajustes, descuentos y devoluciones",
  },
];
