import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../lib/session";
import { GroupDetailView } from "./group-detail";
import type { GroupDetail } from "../types";

export default async function GroupPage({ params }: { params: { id: string } }) {
  await requireCapability(CAPABILITIES.SCHEDULING_MANAGE);
  const group = await serverFetch<GroupDetail>(`/scheduling/groups/${params.id}`);

  if (!group) {
    return <p className="text-sm text-status-error">No se encontro el grupo.</p>;
  }

  return <GroupDetailView initial={group} />;
}
