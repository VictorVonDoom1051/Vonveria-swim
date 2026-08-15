import { SetMetadata } from "@nestjs/common";
import type { Capability } from "@vonveria-swim/permissions";

export const REQUIRE_CAPABILITY_KEY = "requireCapability";

/**
 * Exige al menos una de las capacidades dadas (Seccion 15: RBAC basado en
 * capacidades). Un solo argumento sigue funcionando igual que antes.
 */
export const RequireCapability = (...capabilities: Capability[]) =>
  SetMetadata(REQUIRE_CAPABILITY_KEY, capabilities);
