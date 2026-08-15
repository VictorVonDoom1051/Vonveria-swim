export type ProductCategory = "EQUIPMENT" | "CONSUMABLE";
export type PaymentMethod = "CASH" | "TRANSFER" | "CARD" | "OTHER";
export type StockMovementReason = "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN";

export interface ProductItem {
  id: string;
  name: string;
  category: ProductCategory;
  unitPrice: string;
  currency: string;
  isActive: boolean;
  stockOnHand: number;
}

export interface StockMovementItem {
  id: string;
  delta: number;
  reason: StockMovementReason;
  notes: string | null;
  createdAt: string;
}

export interface SaleLineItem {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  product: { id: string; name: string };
}

export interface SaleItem {
  id: string;
  total: string;
  method: PaymentMethod;
  soldAt: string;
  lines: SaleLineItem[];
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  EQUIPMENT: "Equipo",
  CONSUMABLE: "Consumible",
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  OTHER: "Otro",
};

export const MOVEMENT_LABELS: Record<StockMovementReason, string> = {
  PURCHASE: "Entrada",
  SALE: "Venta",
  ADJUSTMENT: "Ajuste",
  RETURN: "Devolucion",
};

export function formatCurrency(amount: string | number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(Number(amount));
}
