"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, StatusBadge } from "@vonveria-swim/ui";
import { BillingSection, type BillingData, type BillingSectionHandle } from "./billing-section";
import { EnrollmentActionsModal } from "./enrollment-actions-modal";
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
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
              className="flex flex-col rounded-md border border-border-subtle p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-text-primary">{enrollment.group.name}</p>
                <p className="text-text-secondary">
                  {enrollment.group.program.name} · {enrollment.group.level.name}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2 sm:mt-0">
                <StatusBadge tone={enrollment.status === "ACTIVE" ? "success" : "attention"}>
                  {enrollment.status}
                </StatusBadge>
                {enrollment.status === "ACTIVE" ? (
                  <button
                    onClick={() => {
                      setSelectedEnrollmentId(enrollment.id);
                      setIsModalOpen(true);
                    }}
                    className="rounded px-2 py-1 text-xs font-medium text-text-secondary transition hover:bg-background-secondary hover:text-text-primary"
                  >
                    ⋮
                  </button>
                ) : null}
              </div>
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

      <EnrollmentActionsModal
        enrollmentId={selectedEnrollmentId || ""}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (toStatus, reason, description) => {
          if (!selectedEnrollmentId) return;
          setIsLoading(true);
          try {
            const response = await fetch(`/api/enrollments/${selectedEnrollmentId}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ toStatus, reason, description }),
            });
            if (!response.ok) throw new Error("Error al cambiar estado");
            window.location.reload();
          } finally {
            setIsLoading(false);
          }
        }}
        isLoading={isLoading}
      />

      {billing ? (
        <BillingSection ref={billingSectionRef} studentId={student.id} initial={billing} />
      ) : null}
    </div>
  );
}
