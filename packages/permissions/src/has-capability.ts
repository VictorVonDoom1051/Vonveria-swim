import type { Capability } from "./capabilities";

/**
 * Funcion pura: no conoce Prisma ni HTTP. Quien la llama ya resolvio la
 * lista plana de capacidades del usuario (union de las capacidades de
 * todos sus roles).
 */
export function hasCapability(userCapabilities: readonly string[], required: Capability): boolean {
  return userCapabilities.includes(required);
}
