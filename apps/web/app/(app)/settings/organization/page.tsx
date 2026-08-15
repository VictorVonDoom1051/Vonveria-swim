import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../lib/session";
import { OrganizationForm } from "./organization-form";
import type { OrganizationData } from "./types";

export default async function OrganizationSettingsPage() {
  await requireCapability(CAPABILITIES.ORGANIZATION_MANAGE);
  const data = await serverFetch<OrganizationData>("/organization");

  if (!data) {
    return <p className="text-sm text-status-error">No se pudo cargar la organizacion.</p>;
  }

  return <OrganizationForm initial={data} />;
}
