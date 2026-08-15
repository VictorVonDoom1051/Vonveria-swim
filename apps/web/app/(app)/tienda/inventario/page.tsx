import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../lib/session";
import { InventoryManager } from "./inventory-manager";
import type { ProductItem } from "../types";

export default async function InventarioPage() {
  await requireCapability(CAPABILITIES.INVENTORY_MANAGE);
  const products =
    (await serverFetch<ProductItem[]>("/inventory/products?includeInactive=true")) ?? [];

  return <InventoryManager initialProducts={products} />;
}
