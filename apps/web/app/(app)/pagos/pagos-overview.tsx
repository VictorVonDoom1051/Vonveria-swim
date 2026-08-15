"use client";

import Link from "next/link";
import { Card, StatusBadge } from "@vonveria-swim/ui";
import type { StatusTone } from "@vonveria-swim/ui";
import type { ChargeItem, ChargeStatus } from "./types";

const STATUS_LABELS: Record<ChargeStatus, string> = {
  PENDING: "Pendiente",
  PARTIALLY_PAID: "Parcial",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
};

const STATUS_TONES: Record<ChargeStatus, StatusTone> = {
  PENDING: "debt",
  PARTIALLY_PAID: "attention",
  PAID: "success",
  CANCELLED: "error",
};

function isOverdue(charge: ChargeItem): boolean {
  return charge.dueDate !== null && new Date(charge.dueDate) < new Date();
}

function formatMoney(amount: string): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(amount),
  );
}

export function PagosOverview({ initial }: { initial: ChargeItem[] }) {
  const totalDebt = initial.reduce((sum, charge) => sum + Number(charge.balance), 0);
  const overdueCount = initial.filter(isOverdue).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-text-primary">Pagos</h1>
        <div className="flex gap-2">
          <Link href="/pagos/corte" className="text-sm font-medium text-brand-deep hover:underline">
            Corte de caja
          </Link>
          <Link href="/reportes" className="text-sm font-medium text-brand-deep hover:underline">
            Reportes
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Card className="min-w-[220px]">
          <p className="text-sm text-text-secondary">Adeudo total</p>
          <p className="text-2xl font-semibold text-status-debt">
            {formatMoney(String(totalDebt))}
          </p>
        </Card>
        <Card className="min-w-[220px]">
          <p className="text-sm text-text-secondary">Cargos vencidos</p>
          <p className="text-2xl font-semibold text-status-error">{overdueCount}</p>
        </Card>
      </div>

      <Card className="max-w-4xl">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Cargos pendientes</h2>
        {initial.length === 0 ? (
          <p className="text-sm text-text-secondary">No hay adeudos pendientes.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {initial.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between rounded-md border border-border-subtle p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-text-primary">
                    {charge.student?.fullName ?? "Alumno"} · {charge.description}
                  </p>
                  <p className="text-text-secondary">
                    Saldo {formatMoney(charge.balance)}
                    {charge.dueDate
                      ? ` · Vence ${new Date(charge.dueDate).toLocaleDateString("es-MX")}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge tone={isOverdue(charge) ? "error" : STATUS_TONES[charge.status]}>
                    {isOverdue(charge) ? "Vencido" : STATUS_LABELS[charge.status]}
                  </StatusBadge>
                  {charge.student ? (
                    <Link
                      href={`/alumnos/estudiantes/${charge.student.id}#cobranza`}
                      className="text-sm font-medium text-brand-deep hover:underline"
                    >
                      Registrar pago
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
