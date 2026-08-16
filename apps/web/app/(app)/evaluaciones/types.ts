export interface AssessableStudent {
  id: string;
  fullName: string;
  enrollments: Array<{ group: { name: string; level: { name: string } } }>;
}

export interface AssessmentItem {
  id: string;
  assessedAt: string;
  observation: string;
  student: { id: string; fullName: string };
  evaluator: { id: string; fullName: string };
  suggestedLevel: { id: string; name: string } | null;
}

export interface LevelOption {
  id: string;
  name: string;
}
