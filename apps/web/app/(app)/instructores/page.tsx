import Link from "next/link";
import { Card, StatusBadge } from "@vonveria-swim/ui";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../lib/session";

type WeekDay = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

const DAY_LABELS: Record<WeekDay, string> = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mie",
  THURSDAY: "Jue",
  FRIDAY: "Vie",
  SATURDAY: "Sab",
  SUNDAY: "Dom",
};

const DAY_ORDER: WeekDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

interface ScheduleRule {
  weekDay: WeekDay;
  startTime: string;
  durationMinutes: number;
}

interface InstructorGroup {
  id: string;
  name: string;
  programName: string;
  levelName: string;
  poolName: string;
  laneName: string | null;
  capacity: number;
  isPublished: boolean;
  activeEnrollments: number;
  scheduleRules: ScheduleRule[];
}

interface InstructorOverview {
  id: string;
  fullName: string;
  email: string;
  status: string;
  groups: InstructorGroup[];
}

/** "Lun, Mar, Mie 09:00 (60 min)" en vez de un renglon por dia. */
function describeSchedule(rules: ScheduleRule[]): string {
  if (rules.length === 0) return "Sin horario definido";

  const byTime = new Map<string, WeekDay[]>();
  for (const rule of rules) {
    const key = `${rule.startTime} (${rule.durationMinutes} min)`;
    byTime.set(key, [...(byTime.get(key) ?? []), rule.weekDay]);
  }

  return [...byTime.entries()]
    .map(([time, days]) => {
      const ordered = DAY_ORDER.filter((day) => days.includes(day)).map((day) => DAY_LABELS[day]);
      return `${ordered.join(", ")} ${time}`;
    })
    .join(" · ");
}

export default async function InstructoresPage() {
  await requireCapability(CAPABILITIES.SCHEDULING_MANAGE);
  const instructors = (await serverFetch<InstructorOverview[]>("/instructors/overview")) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Instructores</h1>
        <p className="text-sm text-text-secondary">
          Quien da cada clase, con que horario y cuantos alumnos lleva. Para dar de alta o cambiar
          un instructor, ve a{" "}
          <Link href="/settings/users" className="text-brand-deep hover:underline">
            Configuracion → Usuarios
          </Link>
          .
        </p>
      </div>

      {instructors.length === 0 ? (
        <Card className="max-w-xl">
          <p className="text-sm text-text-secondary">Todavia no hay instructores registrados.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {instructors.map((instructor) => (
            <Card key={instructor.id}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="font-medium text-text-primary">{instructor.fullName}</h2>
                  <p className="text-xs text-text-secondary">{instructor.email}</p>
                </div>
                {instructor.status !== "ACTIVE" ? (
                  <StatusBadge tone="attention">Suspendido</StatusBadge>
                ) : null}
              </div>

              {instructor.groups.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  Sin grupos asignados.{" "}
                  <Link href="/clases" className="text-brand-deep hover:underline">
                    Asignarle uno
                  </Link>
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {instructor.groups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-md border border-border-subtle p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium text-text-primary">{group.name}</span>
                        <span className="text-text-secondary">
                          {group.activeEnrollments}/{group.capacity} alumnos
                        </span>
                      </div>
                      <p className="text-text-secondary">
                        {group.programName} · {group.levelName} · {group.poolName}
                        {group.laneName ? ` · ${group.laneName}` : ""}
                      </p>
                      <p className="text-text-secondary">{describeSchedule(group.scheduleRules)}</p>
                      {!group.isPublished ? (
                        <p className="mt-1 text-xs text-status-attention">Sin publicar</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
