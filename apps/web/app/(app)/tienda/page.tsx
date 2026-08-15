import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../lib/session";
import { CounterSale } from "./counter-sale";
import type { ProductItem } from "./types";

export default async function TiendaPage() {
  await requireCapability(CAPABILITIES.SALES_MANAGE);
  const products = (await serverFetch<ProductItem[]>("/inventory/products")) ?? [];

  return <CounterSale initialProducts={products} />;
}
