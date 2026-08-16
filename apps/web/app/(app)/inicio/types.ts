export interface OccupancySessionItem {
  id: string;
  startsAt: string;
  endsAt: string;
  group: {
    id: string;
    name: string;
    instructor: { id: string; fullName: string } | null;
  };
}

export interface LaneState {
  id: string;
  name: string;
  current: OccupancySessionItem | null;
  next: OccupancySessionItem | null;
}

export interface PoolState {
  id: string;
  name: string;
  branchName: string;
  lanes: LaneState[];
  /** Clases sin carril asignado: ocupan la alberca entera. */
  poolLevel: { current: OccupancySessionItem | null; next: OccupancySessionItem | null };
}

export interface OverdueCharge {
  id: string;
  description: string;
  balance: string;
  dueDate: string | null;
  student?: { id: string; fullName: string };
}

export interface TodayAbsence {
  id: string;
  notes: string | null;
  student: { id: string; fullName: string };
  session: { id: string; startsAt: string; group: { id: string; name: string } };
}

export interface DashboardToday {
  pools: PoolState[];
  overdueCharges: OverdueCharge[];
  todayAbsences: TodayAbsence[];
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export function formatMoney(amount: string): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(amount),
  );
}
