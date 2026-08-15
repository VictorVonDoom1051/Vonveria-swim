import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../../lib/session";
import { StudentDetailView } from "./student-detail";
import type { StudentDetail } from "../../types";
import type { ProgramItem } from "../../../settings/programs/types";
import type { ChargeItem, PackageCreditItem, PaymentItem } from "../../../pagos/types";

export default async function StudentPage({ params }: { params: { id: string } }) {
  const user = await requireCapability(CAPABILITIES.STUDENTS_MANAGE);
  const canManageBilling = user.capabilities.includes(CAPABILITIES.BILLING_MANAGE);
  const canAdjust = user.capabilities.includes(CAPABILITIES.BILLING_ADJUST);

  const [student, programs, charges, payments, packageCredits] = await Promise.all([
    serverFetch<StudentDetail>(`/students/${params.id}`),
    serverFetch<ProgramItem[]>("/programs"),
    canManageBilling ? serverFetch<ChargeItem[]>(`/billing/charges/students/${params.id}`) : null,
    canManageBilling ? serverFetch<PaymentItem[]>(`/billing/payments/students/${params.id}`) : null,
    canManageBilling
      ? serverFetch<PackageCreditItem[]>(`/billing/packages/students/${params.id}`)
      : null,
  ]);

  if (!student) {
    return <p className="text-sm text-status-error">No se encontro al alumno.</p>;
  }

  return (
    <StudentDetailView
      initial={student}
      programs={programs ?? []}
      billing={
        canManageBilling
          ? {
              canAdjust,
              charges: charges ?? [],
              payments: payments ?? [],
              packageCredits: packageCredits ?? [],
            }
          : null
      }
    />
  );
}
