import { requireUser } from "../../../lib/session";
import { ComingSoon } from "../coming-soon";

export default async function EvaluacionesPage() {
  await requireUser();
  return <ComingSoon title="Evaluaciones" milestone="M5 (Evaluaciones y reportes)" />;
}
