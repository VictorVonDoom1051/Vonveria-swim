import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../lib/session";
import { PagosOverview } from "./pagos-overview";
import type { ChargeItem } from "./types";

export default async function PagosPage() {
  await requireCapability(CAPABILITIES.BILLING_MANAGE);
  const charges = await serverFetch<ChargeItem[]>("/billing/charges/pending");

  return <PagosOverview initial={charges ?? []} />;
}
