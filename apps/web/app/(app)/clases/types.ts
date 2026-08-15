export interface GroupListItem {
  id: string;
  name: string;
  capacity: number;
  isPublished: boolean;
  program: { id: string; name: string };
  level: { id: string; name: string };
  branch: { id: string; name: string };
  pool: { id: string; name: string };
  lane: { id: string; name: string } | null;
  instructor: { id: string; fullName: string } | null;
  _count: { enrollments: number };
}

export interface ScheduleRuleItem {
  id: string;
  weekDay: string;
  startTime: string;
  durationMinutes: number;
}

export interface SessionItem {
  id: string;
  startsAt: string;
  endsAt: string;
}

export interface EnrollmentRosterItem {
  id: string;
  student: { id: string; fullName: string };
}

export interface GroupDetail extends GroupListItem {
  scheduleRules: ScheduleRuleItem[];
  sessions: SessionItem[];
  enrollments: EnrollmentRosterItem[];
}

export const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miercoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sabado",
  SUNDAY: "Domingo",
};
