import Link from "next/link";
import { Card } from "@vonveria-swim/ui";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../lib/session";
import { PoolMap } from "./pool-map";
import { formatMoney, formatTime, type DashboardToday } from "./types";

const QUICK_ACTIONS = [
  { label: "Nuevo alumno", href: "/alumnos" },
  { label: "Registrar pago", href: "/pagos" },
  { label: "Asistencia", href: "/asistencia" },
];

export default async function InicioPage() {
  const user = await requireCapability(CAPABILITIES.STUDENTS_MANAGE);
  const today = await serverFetch<DashboardToday>("/dashboard/today");

  const pools = today?.pools ?? [];
  const overdueCharges = today?.overdueCharges ?? [];
  const todayAbsences = today?.todayAbsences ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-text-primary">
          Hola, {user.fullName.split(" ")[0]}
        </h1>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm text-text-primary hover:bg-bg-base"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-secondary">Albercas ahora</h2>
        <PoolMap pools={pools} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary">Pagos vencidos</h2>
            <Link href="/pagos" className="text-xs text-brand-deep hover:underline">
              Ver pagos
            </Link>
          </div>
          <Card>
            {overdueCharges.length === 0 ? (
              <p className="text-sm text-text-secondary">Nada vencido. Todo al corriente.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {overdueCharges.slice(0, 6).map((charge) => (
                  <li key={charge.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text-primary">
                        {charge.student?.fullName ?? "Alumno"}
                      </p>
                      <p className="truncate text-xs text-text-secondary">{charge.description}</p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-medium text-status-error">
                      {formatMoney(charge.balance)}
                    </span>
                  </li>
                ))}
                {overdueCharges.length > 6 ? (
                  <li className="text-xs text-text-secondary">y {overdueCharges.length - 6} mas</li>
                ) : null}
              </ul>
            )}
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary">Faltas avisadas hoy</h2>
            <Link href="/asistencia" className="text-xs text-brand-deep hover:underline">
              Ver asistencia
            </Link>
          </div>
          <Card>
            {todayAbsences.length === 0 ? (
              <p className="text-sm text-text-secondary">Ningun familiar aviso una falta hoy.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {todayAbsences.map((absence) => (
                  <li key={absence.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text-primary">
                        {absence.student.fullName}
                      </p>
                      <p className="truncate text-xs text-text-secondary">
                        {absence.session.group.name} · {formatTime(absence.session.startsAt)}
                        {absence.notes ? ` · ${absence.notes}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
