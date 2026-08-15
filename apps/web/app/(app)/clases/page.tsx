import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../lib/session";
import { GroupsList } from "./groups-list";
import type { GroupListItem } from "./types";

export default async function ClasesPage() {
  await requireCapability(CAPABILITIES.SCHEDULING_MANAGE);
  const groups = await serverFetch<GroupListItem[]>("/scheduling/groups");

  return <GroupsList groups={groups ?? []} />;
}
