import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../lib/session";
import { CashClosingView } from "./cash-closing-view";
import type { CashClosingItem, CashClosingOpenSummary } from "../types";

export default async function CashClosingPage() {
  await requireCapability(CAPABILITIES.BILLING_MANAGE);
  const [closings, openSummary] = await Promise.all([
    serverFetch<CashClosingItem[]>("/billing/cash-closings"),
    serverFetch<CashClosingOpenSummary>("/billing/cash-closings/open-summary"),
  ]);

  return (
    <CashClosingView
      initialClosings={closings ?? []}
      initialOpenSummary={openSummary ?? { totals: { CASH: "0", TRANSFER: "0", CARD: "0", OTHER: "0" }, payments: [] }}
    />
  );
}
