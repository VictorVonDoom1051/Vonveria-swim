import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../lib/session";
import { ProgramsManager } from "./programs-manager";
import type { ProgramItem } from "./types";

export default async function ProgramsSettingsPage() {
  await requireCapability(CAPABILITIES.CATALOG_MANAGE);
  const programs = await serverFetch<ProgramItem[]>("/programs");

  return <ProgramsManager initial={programs ?? []} />;
}
