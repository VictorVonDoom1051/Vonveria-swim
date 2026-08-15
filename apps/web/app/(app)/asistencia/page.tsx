import { requireUser } from "../../../lib/session";
import { ComingSoon } from "../coming-soon";

export default async function AsistenciaPage() {
  await requireUser();
  return <ComingSoon title="Asistencia" milestone="M4 (Asistencia)" />;
}
