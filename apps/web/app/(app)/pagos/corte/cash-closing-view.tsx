"use client";

import { useState } from "react";
import { Button, Card, Modal, StatusBadge } from "@vonveria-swim/ui";
import { apiFetch, ApiRequestError } from "../../../../lib/api-client";
import type {
  CashClosingDetail,
  CashClosingItem,
  CashClosingOpenSummary,
  OpenPaymentItem,
} from "../types";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  OTHER: "Otro",
};

function formatMoney(amount: string): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(amount),
  );
}

function DetailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PaymentBreakdown({ payment }: { payment: OpenPaymentItem }) {
  return (
    <div className="rounded-md border border-border-subtle p-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium text-text-primary">{payment.student.fullName}</p>
        <p className="font-medium text-text-primary">{formatMoney(payment.amount)}</p>
      </div>
      <p className="mb-2 text-text-secondary">
        {METHOD_LABELS[payment.method] ?? payment.method} ·{" "}
        {new Date(payment.receivedAt).toLocaleString("es-MX")}
      </p>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-secondary">
        Aplicado a
      </p>
      <div className="flex flex-col gap-0.5">
        {payment.allocations.map((allocation) => (
          <div key={allocation.id} className="flex items-center justify-between text-text-primary">
            <span>{allocation.charge.description}</span>
            <span>{formatMoney(allocation.amount)}</span>
          </div>
        ))}
      </div>
      {payment.refunds.length > 0 ? (
        <p className="mt-2 text-status-error">
          Devuelto:{" "}
          {formatMoney(
            String(payment.refunds.reduce((sum, refund) => sum + Number(refund.amount), 0)),
          )}
        </p>
      ) : null}
    </div>
  );
}

export function CashClosingView({
  initialClosings,
  initialOpenSummary,
}: {
  initialClosings: CashClosingItem[];
  initialOpenSummary: CashClosingOpenSummary;
}) {
  const [closings, setClosings] = useState(initialClosings);
  const [openSummary, setOpenSummary] = useState(initialOpenSummary);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [detailTitle, setDetailTitle] = useState<string | null>(null);
  const [detailPayments, setDetailPayments] = useState<OpenPaymentItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const openTotal =
    Number(openSummary.totals.CASH) +
    Number(openSummary.totals.TRANSFER) +
    Number(openSummary.totals.CARD) +
    Number(openSummary.totals.OTHER);

  async function handleClose(): Promise<void> {
    setClosing(true);
    setError(null);
    try {
      await apiFetch("/billing/cash-closings", { method: "POST" });
      const [refreshedClosings, refreshedOpenSummary] = await Promise.all([
        apiFetch<CashClosingItem[]>("/billing/cash-closings"),
        apiFetch<CashClosingOpenSummary>("/billing/cash-closings/open-summary"),
      ]);
      setClosings(refreshedClosings);
      setOpenSummary(refreshedOpenSummary);
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        err.body.errorCode === "CASH_CLOSING_NO_OPEN_PAYMENTS"
      ) {
        setError("No hay movimientos pendientes de corte.");
      } else {
        setError("No se pudo cerrar la caja.");
      }
    } finally {
      setClosing(false);
    }
  }

  function openPaymentDetail(payment: OpenPaymentItem): void {
    setDetailTitle("Detalle del pago");
    setDetailPayments([payment]);
  }

  async function openClosingDetail(closing_: CashClosingItem): Promise<void> {
    setDetailLoading(true);
    setDetailTitle(
      `Corte ${new Date(closing_.openedAt).toLocaleString("es-MX")} — ${new Date(closing_.closedAt).toLocaleString("es-MX")}`,
    );
    setDetailPayments([]);
    try {
      const detail = await apiFetch<CashClosingDetail>(
        `/billing/cash-closings/${closing_.id}/detail`,
      );
      setDetailPayments(detail.payments);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6 print:hidden">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-text-primary">Corte de caja</h1>
          <Button
            onClick={() => void handleClose()}
            disabled={
              closing || (openSummary.payments.length === 0 && openSummary.sales.length === 0)
            }
          >
            {closing ? "Cerrando..." : "Cerrar caja"}
          </Button>
        </div>

        {error ? <p className="text-sm text-status-error">{error}</p> : null}

        <Card className="max-w-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Pendiente de cerrar</h2>
            <StatusBadge tone={openTotal > 0 ? "debt" : "success"}>
              {formatMoney(String(openTotal))}
            </StatusBadge>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <p className="text-text-secondary">Efectivo</p>
              <p className="font-medium text-text-primary">
                {formatMoney(openSummary.totals.CASH)}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Transferencia</p>
              <p className="font-medium text-text-primary">
                {formatMoney(openSummary.totals.TRANSFER)}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Tarjeta</p>
              <p className="font-medium text-text-primary">
                {formatMoney(openSummary.totals.CARD)}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Otro</p>
              <p className="font-medium text-text-primary">
                {formatMoney(openSummary.totals.OTHER)}
              </p>
            </div>
          </div>

          {openSummary.payments.length === 0 && openSummary.sales.length === 0 ? (
            <p className="text-sm text-text-secondary">No hay movimientos pendientes de corte.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {openSummary.sales.length > 0 ? (
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Colegiaturas
                </p>
              ) : null}
              {openSummary.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-md border border-border-subtle p-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-text-primary">{payment.student.fullName}</p>
                    <p className="text-text-secondary">
                      {METHOD_LABELS[payment.method] ?? payment.method} ·{" "}
                      {new Date(payment.receivedAt).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-text-primary">{formatMoney(payment.amount)}</p>
                    <button
                      type="button"
                      onClick={() => openPaymentDetail(payment)}
                      aria-label="Ver detalle del pago"
                      className="rounded-md p-1 text-text-secondary hover:bg-bg-base hover:text-brand-deep"
                    >
                      <DetailIcon />
                    </button>
                  </div>
                </div>
              ))}

              {openSummary.sales.length > 0 ? (
                <>
                  <p className="mb-1 mt-3 text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Tienda ·{" "}
                    {formatMoney(
                      String(
                        Number(openSummary.saleTotals.CASH) +
                          Number(openSummary.saleTotals.TRANSFER) +
                          Number(openSummary.saleTotals.CARD) +
                          Number(openSummary.saleTotals.OTHER),
                      ),
                    )}
                  </p>
                  {openSummary.sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between rounded-md border border-border-subtle p-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text-primary">
                          {sale.lines
                            .map((line) => `${line.product.name} x${line.quantity}`)
                            .join(", ")}
                        </p>
                        <p className="text-text-secondary">
                          {METHOD_LABELS[sale.method] ?? sale.method} ·{" "}
                          {new Date(sale.soldAt).toLocaleString("es-MX")}
                        </p>
                      </div>
                      <p className="font-medium text-text-primary">{formatMoney(sale.total)}</p>
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-primary">Cortes anteriores</h2>
          {closings.map((closing_) => (
            <Card key={closing_.id} className="max-w-2xl">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  {new Date(closing_.openedAt).toLocaleString("es-MX")} —{" "}
                  {new Date(closing_.closedAt).toLocaleString("es-MX")}
                </p>
                <button
                  type="button"
                  onClick={() => void openClosingDetail(closing_)}
                  aria-label="Ver detalle del corte"
                  className="rounded-md p-1 text-text-secondary hover:bg-bg-base hover:text-brand-deep"
                >
                  <DetailIcon />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-text-secondary">Efectivo</p>
                  <p className="font-medium text-text-primary">{formatMoney(closing_.totalCash)}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Transferencia</p>
                  <p className="font-medium text-text-primary">
                    {formatMoney(closing_.totalTransfer)}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Tarjeta</p>
                  <p className="font-medium text-text-primary">{formatMoney(closing_.totalCard)}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Otro</p>
                  <p className="font-medium text-text-primary">
                    {formatMoney(closing_.totalOther)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
          {closings.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin cortes de caja todavia.</p>
          ) : null}
        </div>
      </div>

      <Modal
        open={detailTitle !== null}
        onClose={() => setDetailTitle(null)}
        title={detailTitle ?? ""}
        footer={<Button onClick={() => window.print()}>Imprimir</Button>}
      >
        {detailLoading ? (
          <p className="text-sm text-text-secondary">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {detailPayments.map((payment) => (
              <PaymentBreakdown key={payment.id} payment={payment} />
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
