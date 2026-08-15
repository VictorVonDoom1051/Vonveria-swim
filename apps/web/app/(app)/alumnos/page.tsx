import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability } from "../../../lib/session";
import { SearchPanel } from "./search-panel";

export default async function AlumnosPage() {
  await requireCapability(CAPABILITIES.STUDENTS_MANAGE);
  return <SearchPanel />;
}
