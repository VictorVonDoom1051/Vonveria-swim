import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../lib/session";
import { FacilitiesManager } from "./facilities-manager";
import type { BranchItem } from "./types";

export default async function FacilitiesSettingsPage() {
  await requireCapability(CAPABILITIES.CATALOG_MANAGE);
  const branches = await serverFetch<BranchItem[]>("/facilities/branches");

  return <FacilitiesManager initial={branches ?? []} />;
}
