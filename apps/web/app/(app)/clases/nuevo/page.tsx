import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../lib/session";
import { NewGroupForm } from "./new-group-form";
import type { ProgramItem } from "../../settings/programs/types";
import type { BranchItem } from "../../settings/facilities/types";

interface InstructorOption {
  id: string;
  fullName: string;
}

export default async function NewGroupPage() {
  await requireCapability(CAPABILITIES.SCHEDULING_MANAGE);
  const [programs, branches, instructors] = await Promise.all([
    serverFetch<ProgramItem[]>("/programs"),
    serverFetch<BranchItem[]>("/facilities/branches"),
    serverFetch<InstructorOption[]>("/users/instructors"),
  ]);

  return (
    <NewGroupForm
      programs={programs ?? []}
      branches={branches ?? []}
      instructors={instructors ?? []}
    />
  );
}
