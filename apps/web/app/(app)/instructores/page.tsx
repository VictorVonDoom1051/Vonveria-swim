import { requireUser } from "../../../lib/session";
import { ComingSoon } from "../coming-soon";

export default async function InstructoresPage() {
  await requireUser();
  return (
    <ComingSoon title="Instructores" milestone="M2 (Familias, alumnos, instalaciones y clases)" />
  );
}
