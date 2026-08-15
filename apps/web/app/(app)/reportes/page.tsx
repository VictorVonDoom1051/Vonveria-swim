import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../lib/session";
import { ReportsView } from "./reports-view";
import type { BillingSummary } from "./types";

export default async function ReportesPage() {
  await requireCapability(CAPABILITIES.BILLING_MANAGE);
  const summary = await serverFetch<BillingSummary>("/reports/billing-summary");

  return <ReportsView initial={summary} />;
}
