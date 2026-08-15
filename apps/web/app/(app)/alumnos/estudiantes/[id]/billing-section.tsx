"use client";

import { forwardRef, useImperativeHandle, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card, StatusBadge } from "@vonveria-swim/ui";
import type { StatusTone } from "@vonveria-swim/ui";
import { apiFetch, ApiRequestError } from "../../../../../lib/api-client";
import type {
  ChargeItem,
  ChargeStatus,
  PackageCreditItem,
  PaymentItem,
} from "../../../pagos/types";

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

function formatMoney(amount: string): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(amount),
  );
}

export interface BillingData {
  canAdjust: boolean;
  charges: ChargeItem[];
  payments: PaymentItem[];
  packageCredits: PackageCreditItem[];
}

export interface BillingSectionHandle {
  refresh: () => Promise<void>;
}

export const BillingSection = forwardRef<
  BillingSectionHandle,
  { studentId: string; initial: BillingData }
>(function BillingSection({ studentId, initial }, ref) {
  const [charges, setCharges] = useState(initial.charges);
  const [payments, setPayments] = useState(initial.payments);
  const [packageCredits, setPackageCredits] = useState(initial.packageCredits);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [adjustingChargeId, setAdjustingChargeId] = useState<string | null>(null);
  const [refundingPaymentId, setRefundingPaymentId] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    const [nextCharges, nextPayments, nextPackages] = await Promise.all([
      apiFetch<ChargeItem[]>(`/billing/charges/students/${studentId}`),
      apiFetch<PaymentItem[]>(`/billing/payments/students/${studentId}`),
      apiFetch<PackageCreditItem[]>(`/billing/packages/students/${studentId}`),
    ]);
    setCharges(nextCharges);
    setPayments(nextPayments);
    setPackageCredits(nextPackages);
  }

  useImperativeHandle(ref, () => ({ refresh }));

  async function runAction(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? (err.body.errorCode ?? err.message)
          : "No se pudo completar la operacion.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCharge(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const type = String(formData.get("type") ?? "OTHER");
    const description = String(formData.get("description") ?? "");
    const amount = String(formData.get("amount") ?? "");
    await runAction(async () => {
      await apiFetch("/billing/charges", {
        method: "POST",
        body: JSON.stringify({ studentId, type, description, amount }),
      });
      form.reset();
    });
  }

  async function handleCreatePayment(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const amount = String(formData.get("amount") ?? "");
    const method = String(formData.get("method") ?? "CASH");
    await runAction(async () => {
      await apiFetch("/billing/payments", {
        method: "POST",
        body: JSON.stringify({ studentId, amount, method }),
      });
      form.reset();
    });
  }

  async function handleSellPackage(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const totalUnits = Number(formData.get("totalUnits"));
    const validDays = Number(formData.get("validDays"));
    const amount = String(formData.get("amount") ?? "");
    await runAction(async () => {
      await apiFetch("/billing/packages", {
        method: "POST",
        body: JSON.stringify({ studentId, totalUnits, validDays, amount }),
      });
      form.reset();
    });
  }

  async function handlePackageMovement(
    packageCreditId: string,
    direction: "consume" | "return",
  ): Promise<void> {
    await runAction(async () => {
      await apiFetch(`/billing/packages/${packageCreditId}/${direction}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    });
  }

  async function handleAdjustment(
    chargeId: string,
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const amount = String(formData.get("amount") ?? "");
    const reason = String(formData.get("reason") ?? "");
    await runAction(async () => {
      await apiFetch("/billing/adjustments", {
        method: "POST",
        body: JSON.stringify({ chargeId, amount, reason }),
      });
      setAdjustingChargeId(null);
    });
  }

  async function handleRefund(paymentId: string, event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const amount = String(formData.get("amount") ?? "");
    const reason = String(formData.get("reason") ?? "");
    await runAction(async () => {
      await apiFetch("/billing/refunds", {
        method: "POST",
        body: JSON.stringify({ paymentId, amount, reason }),
      });
      setRefundingPaymentId(null);
    });
  }

  return (
    <Card id="cobranza" className="max-w-2xl scroll-mt-4">
      <h2 className="mb-3 text-lg font-semibold text-text-primary">Cobranza</h2>
      {error ? <p className="mb-2 text-sm text-status-error">{error}</p> : null}

      <h3 className="mb-2 text-sm font-semibold text-text-primary">Cargos</h3>
      <div className="mb-4 flex flex-col gap-2">
        {charges.map((charge) => (
          <div key={charge.id} className="rounded-md border border-border-subtle p-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{charge.description}</p>
                <p className="text-text-secondary">Saldo {formatMoney(charge.balance)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={STATUS_TONES[charge.status]}>
                  {STATUS_LABELS[charge.status]}
                </StatusBadge>
                {initial.canAdjust && charge.status !== "CANCELLED" && charge.status !== "PAID" ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-brand-deep hover:underline"
                    onClick={() =>
                      setAdjustingChargeId(adjustingChargeId === charge.id ? null : charge.id)
                    }
                  >
                    Aplicar ajuste
                  </button>
                ) : null}
              </div>
            </div>
            {adjustingChargeId === charge.id ? (
              <form
                onSubmit={(event) => void handleAdjustment(charge.id, event)}
                className="mt-2 flex flex-wrap gap-2"
              >
                <input
                  name="amount"
                  required
                  placeholder="Monto (- descuento)"
                  className="w-40 rounded-md border border-border-subtle px-2 py-1 text-xs"
                />
                <input
                  name="reason"
                  required
                  placeholder="Motivo"
                  className="flex-1 rounded-md border border-border-subtle px-2 py-1 text-xs"
                />
                <Button type="submit" disabled={busy} className="text-xs">
                  Aplicar
                </Button>
              </form>
            ) : null}
          </div>
        ))}
        {charges.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin cargos todavia.</p>
        ) : null}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <form onSubmit={handleCreateCharge} className="flex flex-1 flex-wrap gap-2">
          <select name="type" className="rounded-md border border-border-subtle px-2 py-1 text-xs">
            <option value="SINGLE_CLASS">Clase individual</option>
            <option value="OTHER">Otro</option>
          </select>
          <input
            name="description"
            required
            placeholder="Descripcion"
            className="flex-1 rounded-md border border-border-subtle px-2 py-1 text-xs"
          />
          <input
            name="amount"
            required
            placeholder="Monto"
            className="w-24 rounded-md border border-border-subtle px-2 py-1 text-xs"
          />
          <Button type="submit" disabled={busy} variant="secondary" className="text-xs">
            Registrar cargo
          </Button>
        </form>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-text-primary">Registrar pago</h3>
      <form onSubmit={handleCreatePayment} className="mb-4 flex flex-wrap gap-2">
        <input
          name="amount"
          required
          placeholder="Monto recibido"
          className="w-32 rounded-md border border-border-subtle px-2 py-1 text-sm"
        />
        <select name="method" className="rounded-md border border-border-subtle px-2 py-1 text-sm">
          <option value="CASH">Efectivo</option>
          <option value="TRANSFER">Transferencia</option>
          <option value="CARD">Tarjeta</option>
          <option value="OTHER">Otro</option>
        </select>
        <Button type="submit" disabled={busy}>
          Registrar pago
        </Button>
      </form>

      <h3 className="mb-2 text-sm font-semibold text-text-primary">Pagos</h3>
      <div className="mb-4 flex flex-col gap-2">
        {payments.map((payment) => (
          <div key={payment.id} className="rounded-md border border-border-subtle p-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{formatMoney(payment.amount)}</p>
                <p className="text-text-secondary">
                  {payment.method} · {new Date(payment.receivedAt).toLocaleDateString("es-MX")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/pagos/recibos/${payment.id}`}
                  className="text-xs font-medium text-brand-deep hover:underline"
                >
                  Recibo
                </Link>
                {initial.canAdjust ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-status-error hover:underline"
                    onClick={() =>
                      setRefundingPaymentId(refundingPaymentId === payment.id ? null : payment.id)
                    }
                  >
                    Devolver
                  </button>
                ) : null}
              </div>
            </div>
            {refundingPaymentId === payment.id ? (
              <form
                onSubmit={(event) => void handleRefund(payment.id, event)}
                className="mt-2 flex flex-wrap gap-2"
              >
                <input
                  name="amount"
                  required
                  placeholder="Monto a devolver"
                  className="w-32 rounded-md border border-border-subtle px-2 py-1 text-xs"
                />
                <input
                  name="reason"
                  required
                  placeholder="Motivo"
                  className="flex-1 rounded-md border border-border-subtle px-2 py-1 text-xs"
                />
                <Button type="submit" disabled={busy} className="text-xs">
                  Confirmar devolucion
                </Button>
              </form>
            ) : null}
          </div>
        ))}
        {payments.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin pagos registrados.</p>
        ) : null}
      </div>

      <h3 className="mb-2 text-sm font-semibold text-text-primary">Paquetes</h3>
      <div className="mb-4 flex flex-col gap-2">
        {packageCredits.map((credit) => (
          <div
            key={credit.id}
            className="flex items-center justify-between rounded-md border border-border-subtle p-3 text-sm"
          >
            <div>
              <p className="font-medium text-text-primary">{credit.charge.description}</p>
              <p className="text-text-secondary">
                {credit.remainingUnits} de {credit.totalUnits} clases restantes · vence{" "}
                {new Date(credit.validUntil).toLocaleDateString("es-MX")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || credit.remainingUnits <= 0}
                className="text-xs font-medium text-brand-deep hover:underline disabled:opacity-50"
                onClick={() => void handlePackageMovement(credit.id, "consume")}
              >
                Consumir 1
              </button>
              <button
                type="button"
                disabled={busy || credit.remainingUnits >= credit.totalUnits}
                className="text-xs font-medium text-brand-deep hover:underline disabled:opacity-50"
                onClick={() => void handlePackageMovement(credit.id, "return")}
              >
                Devolver 1
              </button>
            </div>
          </div>
        ))}
        {packageCredits.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin paquetes vendidos.</p>
        ) : null}
      </div>

      <form onSubmit={handleSellPackage} className="flex flex-wrap gap-2">
        <input
          name="totalUnits"
          type="number"
          min="1"
          required
          placeholder="Clases"
          className="w-20 rounded-md border border-border-subtle px-2 py-1 text-xs"
        />
        <input
          name="validDays"
          type="number"
          min="1"
          required
          placeholder="Dias de vigencia"
          className="w-28 rounded-md border border-border-subtle px-2 py-1 text-xs"
        />
        <input
          name="amount"
          required
          placeholder="Monto"
          className="w-24 rounded-md border border-border-subtle px-2 py-1 text-xs"
        />
        <Button type="submit" disabled={busy} variant="secondary" className="text-xs">
          Vender paquete
        </Button>
      </form>
    </Card>
  );
});
