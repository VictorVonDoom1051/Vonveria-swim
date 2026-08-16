import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../lib/session";
import { AssessmentsView } from "./assessments-view";
import type { AssessableStudent, AssessmentItem, LevelOption } from "./types";

interface ProgramWithLevels {
  id: string;
  name: string;
  levels: LevelOption[];
}

export default async function EvaluacionesPage() {
  await requireCapability(CAPABILITIES.ASSESSMENTS_MANAGE);

  const [assessments, students, programs] = await Promise.all([
    serverFetch<AssessmentItem[]>("/assessments"),
    serverFetch<AssessableStudent[]>("/assessments/students"),
    serverFetch<ProgramWithLevels[]>("/programs"),
  ]);

  const levels = (programs ?? []).flatMap((program) =>
    program.levels.map((level) => ({ id: level.id, name: `${program.name} — ${level.name}` })),
  );

  return (
    <AssessmentsView
      initialAssessments={assessments ?? []}
      students={students ?? []}
      levels={levels}
    />
  );
}
