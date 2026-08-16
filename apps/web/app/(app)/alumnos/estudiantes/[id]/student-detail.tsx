"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button, Card, StatusBadge } from "@vonveria-swim/ui";
import { BillingSection, type BillingData, type BillingSectionHandle } from "./billing-section";
import type { StudentDetail } from "../../types";

export function StudentDetailView({
  initial,
  billing,
}: {
  initial: StudentDetail;
  billing: BillingData | null;
}) {
  const student = initial;
  const billingSectionRef = useRef<BillingSectionHandle>(null);

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-2xl">
        <h1 className="text-lg font-semibold text-text-primary">{student.fullName}</h1>
        <p className="text-sm text-text-secondary">
          Familia: {student.family.guardians.map((guardian) => guardian.fullName).join(", ")}
        </p>
        {student.medicalAlerts ? (
          <p className="mt-1 text-sm text-status-attention">
            Alerta medica: {student.medicalAlerts}
          </p>
        ) : null}
      </Card>

      <Card className="max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Inscripciones</h2>
        <div className="mb-4 flex flex-col gap-2">
          {student.enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="flex items-center justify-between rounded-md border border-border-subtle p-3 text-sm"
            >
              <div>
                <p className="font-medium text-text-primary">{enrollment.group.name}</p>
                <p className="text-text-secondary">
                  {enrollment.group.program.name} · {enrollment.group.level.name}
                </p>
              </div>
              <StatusBadge tone={enrollment.status === "ACTIVE" ? "success" : "attention"}>
                {enrollment.status}
              </StatusBadge>
            </div>
          ))}
          {student.enrollments.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin inscripciones todavia.</p>
          ) : null}
        </div>

        <Link href={`/alumnos/inscripcion?alumno=${student.id}`}>
          <Button>Inscribir en un grupo</Button>
        </Link>
      </Card>

      {billing ? (
        <BillingSection ref={billingSectionRef} studentId={student.id} initial={billing} />
      ) : null}
    </div>
  );
}
