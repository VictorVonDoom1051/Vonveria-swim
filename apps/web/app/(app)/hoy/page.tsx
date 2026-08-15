import { Card } from "@vonveria-swim/ui";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireUser, serverFetch } from "../../../lib/session";
import { SessionAttendance } from "../session-attendance";

interface TodaySession {
  id: string;
  startsAt: string;
  endsAt: string;
  group: {
    id: string;
    name: string;
    program: { name: string };
    level: { name: string };
    enrollments: Array<{ id: string; student: { id: string; fullName: string } }>;
  };
}

export default async function HoyPage() {
  const user = await requireUser();
  const sessions = (await serverFetch<TodaySession[]>("/scheduling/sessions/today")) ?? [];
  const canMark = user.capabilities.includes(CAPABILITIES.BILLING_MANAGE);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-text-primary">
        Hola, {user.fullName.split(" ")[0]}
      </h1>

      {sessions.length === 0 ? (
        <Card className="max-w-xl">
          <p className="text-sm text-text-secondary">
            No tienes clases asignadas en los proximos dias.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <Card key={session.id} className="max-w-xl">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-medium text-text-primary">{session.group.name}</h2>
                <span className="text-sm text-text-secondary">
                  {new Date(session.startsAt).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mb-2 text-sm text-text-secondary">
                {session.group.program.name} · {session.group.level.name}
              </p>
              <p className="mb-3 text-sm text-text-primary">
                Alumnos: {session.group.enrollments.length}
              </p>
              <SessionAttendance
                sessionId={session.id}
                enrollments={session.group.enrollments}
                canMark={canMark}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
