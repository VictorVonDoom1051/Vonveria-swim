import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability } from "../../../../lib/session";
import { NewFamilyForm } from "./new-family-form";

export default async function NewFamilyPage() {
  await requireCapability(CAPABILITIES.STUDENTS_MANAGE);
  return <NewFamilyForm />;
}
