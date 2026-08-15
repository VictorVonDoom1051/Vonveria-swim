import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../../lib/session";
import { ReceiptView } from "./receipt-view";
import type { ReceiptDetail } from "../../types";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  await requireCapability(CAPABILITIES.BILLING_MANAGE);
  const receipt = await serverFetch<ReceiptDetail>(`/billing/payments/${params.id}/receipt`);

  if (!receipt) {
    return <p className="text-sm text-status-error">No se encontro el pago.</p>;
  }

  return <ReceiptView receipt={receipt} />;
}
