import type { RoleKey } from "@vonveria-swim/database";

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  roleKeys: RoleKey[];
  capabilities: string[];
}
