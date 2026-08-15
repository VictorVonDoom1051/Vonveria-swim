import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../../lib/session";
import { FamilyDetailView } from "./family-detail";
import type { FamilyDetail } from "../../types";

export default async function FamilyPage({ params }: { params: { id: string } }) {
  await requireCapability(CAPABILITIES.STUDENTS_MANAGE);
  const family = await serverFetch<FamilyDetail>(`/families/${params.id}`);

  if (!family) {
    return <p className="text-sm text-status-error">No se encontro la familia.</p>;
  }

  return <FamilyDetailView initial={family} />;
}
