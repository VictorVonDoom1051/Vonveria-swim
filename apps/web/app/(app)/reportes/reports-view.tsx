"use client";

import { useState, type FormEvent } from "react";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch } from "../../../lib/api-client";
import type { BillingSummary } from "./types";

function formatMoney(amount: string): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(amount),
  );
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export function ReportsView({ initial }: { initial: BillingSummary | null }) {
  const [summary, setSummary] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(initial ? toDateInputValue(initial.rangeFrom) : "");
  const [to, setTo] = useState(initial ? toDateInputValue(initial.rangeTo) : "");

  async function handleQuery(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(to).toISOString());
      const data = await apiFetch<BillingSummary>(`/reports/billing-summary?${params.toString()}`);
      setSummary(data);
      setFrom(toDateInputValue(data.rangeFrom));
      setTo(toDateInputValue(data.rangeTo));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-text-primary">Reportes</h1>

      <form onSubmit={handleQuery} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-secondary">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-md border border-border-subtle px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-secondary">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-md border border-border-subtle px-2 py-1 text-sm"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Consultando..." : "Consultar"}
        </Button>
      </form>

      {summary ? (
        <div className="flex flex-wrap gap-4">
          <Card className="min-w-[220px]">
            <p className="text-sm text-text-secondary">Adeudo total</p>
            <p className="text-2xl font-semibold text-status-debt">
              {formatMoney(summary.totalDebt)}
            </p>
          </Card>
          <Card className="min-w-[220px]">
            <p className="text-sm text-text-secondary">Cobrado en el periodo</p>
            <p className="text-2xl font-semibold text-status-success">
              {formatMoney(summary.collectedInRange)}
            </p>
          </Card>
          <Card className="min-w-[220px]">
            <p className="text-sm text-text-secondary">Paquetes activos</p>
            <p className="text-2xl font-semibold text-text-primary">{summary.activePackages}</p>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-text-secondary">No se pudo cargar el resumen.</p>
      )}
    </div>
  );
}
