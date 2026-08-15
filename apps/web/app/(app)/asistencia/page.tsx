import { Card } from "@vonveria-swim/ui";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../lib/session";
import { SessionAttendance } from "../session-attendance";

interface UpcomingSession {
  id: string;
  startsAt: string;
  endsAt: string;
  group: {
    id: string;
    name: string;
    program: { name: string };
    level: { name: string };
    instructor: { id: string; fullName: string } | null;
    enrollments: Array<{ id: string; student: { id: string; fullName: string } }>;
  };
}

function formatDay(value: string): string {
  return new Date(value).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export default async function AsistenciaPage() {
  const user = await requireCapability(CAPABILITIES.SCHEDULING_MANAGE);
  const sessions = (await serverFetch<UpcomingSession[]>("/scheduling/sessions/upcoming")) ?? [];

  // Marcar exige billing:manage en el backend; el boton se deshabilita si no la
  // tiene para no ofrecer una accion que la API va a rechazar.
  const canMark = user.capabilities.includes(CAPABILITIES.BILLING_MANAGE);

  const sessionsByDay = new Map<string, UpcomingSession[]>();
  for (const session of sessions) {
    const day = formatDay(session.startsAt);
    sessionsByDay.set(day, [...(sessionsByDay.get(day) ?? []), session]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Asistencia</h1>
        <p className="text-sm text-text-secondary">
          Marca a los alumnos cuyo familiar aviso que faltaran. No hace falta pasar lista: todos
          cuentan como presentes salvo que se registre el aviso.
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card className="max-w-xl">
          <p className="text-sm text-text-secondary">
            No hay clases programadas en los proximos siete dias.
          </p>
        </Card>
      ) : (
        [...sessionsByDay.entries()].map(([day, daySessions]) => (
          <section key={day} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold capitalize text-text-secondary">{day}</h2>
            {daySessions.map((session) => (
              <Card key={session.id} className="max-w-xl">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-medium text-text-primary">{session.group.name}</h3>
                  <span className="text-sm text-text-secondary">
                    {formatTime(session.startsAt)}
                  </span>
                </div>
                <p className="mb-3 text-sm text-text-secondary">
                  {session.group.program.name} · {session.group.level.name}
                  {session.group.instructor ? ` · ${session.group.instructor.fullName}` : ""}
                </p>
                <SessionAttendance
                  sessionId={session.id}
                  enrollments={session.group.enrollments}
                  canMark={canMark}
                />
              </Card>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
