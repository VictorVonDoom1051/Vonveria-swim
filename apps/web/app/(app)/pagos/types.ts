export type ChargeType = "ENROLLMENT_FEE" | "MONTHLY_FEE" | "PACKAGE" | "SINGLE_CLASS" | "OTHER";
export type ChargeStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
export type PaymentMethod = "CASH" | "TRANSFER" | "CARD" | "OTHER";

export interface AdjustmentItem {
  id: string;
  amount: string;
  reason: string;
  createdAt: string;
}

export interface PaymentAllocationItem {
  id: string;
  amount: string;
  charge: { id: string; description: string; type: ChargeType };
}

export interface ChargeItem {
  id: string;
  type: ChargeType;
  description: string;
  amount: string;
  status: ChargeStatus;
  dueDate: string | null;
  periodYear: number | null;
  periodMonth: number | null;
  balance: string;
  adjustments: AdjustmentItem[];
  student?: { id: string; fullName: string };
}

export interface RefundItem {
  id: string;
  amount: string;
  reason: string;
  createdAt: string;
}

export interface PaymentItem {
  id: string;
  amount: string;
  method: PaymentMethod;
  receivedAt: string;
  allocations: PaymentAllocationItem[];
  refunds: RefundItem[];
}

export interface PackageCreditItem {
  id: string;
  totalUnits: number;
  remainingUnits: number;
  validFrom: string;
  validUntil: string;
  charge: { description: string };
}

export interface CashClosingItem {
  id: string;
  openedAt: string;
  closedAt: string;
  totalCash: string;
  totalTransfer: string;
  totalCard: string;
  totalOther: string;
}

export interface OpenPaymentItem {
  id: string;
  amount: string;
  method: PaymentMethod;
  receivedAt: string;
  student: { id: string; fullName: string };
  allocations: PaymentAllocationItem[];
  refunds: RefundItem[];
}

export interface CashClosingOpenSummary {
  totals: { CASH: string; TRANSFER: string; CARD: string; OTHER: string };
  payments: OpenPaymentItem[];
}

export interface CashClosingDetail {
  closing: CashClosingItem;
  payments: OpenPaymentItem[];
}

export interface ReceiptDetail {
  id: string;
  amount: string;
  method: PaymentMethod;
  receivedAt: string;
  student: { id: string; fullName: string };
  allocations: PaymentAllocationItem[];
  refunds: RefundItem[];
}
