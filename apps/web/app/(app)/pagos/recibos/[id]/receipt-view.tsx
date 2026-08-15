"use client";

import { Button, Card } from "@vonveria-swim/ui";
import type { ReceiptDetail } from "../../types";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  OTHER: "Otro",
};

function formatMoney(amount: string): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(amount));
}

export function ReceiptView({ receipt }: { receipt: ReceiptDetail }) {
  const totalRefunded = receipt.refunds.reduce((sum, refund) => sum + Number(refund.amount), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-lg font-semibold text-text-primary">Recibo de pago</h1>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </div>

      <Card className="max-w-xl">
        <div className="flex flex-col gap-1 border-b border-border-subtle pb-3">
          <p className="text-sm text-text-secondary">Recibo</p>
          <p className="font-mono text-sm text-text-primary">{receipt.id}</p>
        </div>

        <div className="flex flex-col gap-1 py-3">
          <p className="text-sm text-text-secondary">Alumno</p>
          <p className="font-medium text-text-primary">{receipt.student.fullName}</p>
        </div>

        <div className="flex flex-col gap-1 py-3">
          <p className="text-sm text-text-secondary">Fecha</p>
          <p className="text-text-primary">{new Date(receipt.receivedAt).toLocaleString("es-MX")}</p>
        </div>

        <div className="flex flex-col gap-1 py-3">
          <p className="text-sm text-text-secondary">Metodo de pago</p>
          <p className="text-text-primary">{METHOD_LABELS[receipt.method] ?? receipt.method}</p>
        </div>

        <div className="py-3">
          <p className="mb-2 text-sm text-text-secondary">Aplicado a</p>
          <div className="flex flex-col gap-1">
            {receipt.allocations.map((allocation) => (
              <div key={allocation.id} className="flex items-center justify-between text-sm">
                <span className="text-text-primary">{allocation.charge.description}</span>
                <span className="text-text-primary">{formatMoney(allocation.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle pt-3">
          <span className="font-semibold text-text-primary">Total pagado</span>
          <span className="font-semibold text-text-primary">{formatMoney(receipt.amount)}</span>
        </div>

        {receipt.refunds.length > 0 ? (
          <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3 text-status-error">
            <span className="font-semibold">Total devuelto</span>
            <span className="font-semibold">{formatMoney(String(totalRefunded))}</span>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
