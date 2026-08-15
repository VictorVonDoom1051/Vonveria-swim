"use client";

import { useState } from "react";
import { apiFetch } from "../../../lib/api-client";
import { Modal } from "@vonveria-swim/ui";

interface Enrollment {
  id: string;
  student: { id: string; fullName: string };
}

interface AttendanceStatus {
  [studentId: string]: {
    status: "PRESENT" | "ABSENT_JUSTIFIED";
    notes?: string | null;
  };
}

function PersonIcon({ absent }: { absent: boolean }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill={absent ? "currentColor" : "currentColor"}
      stroke="none"
      className={absent ? "text-status-error" : "text-status-success"}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3" />
      <path d="M 12 15 C 8 15 5 17 5 20 L 19 20 C 19 17 16 15 12 15 Z" />
    </svg>
  );
}

export function SessionAttendance({
  sessionId,
  enrollments,
  isInstructor,
}: {
  sessionId: string;
  enrollments: Enrollment[];
  isInstructor: boolean;
}) {
  const [attendance, setAttendance] = useState<AttendanceStatus>({});
  const [loading, setLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  async function loadAttendance() {
    if (loading) return;
    setLoading(true);
    try {
      const data = await apiFetch<
        Array<{
          studentId: string;
          status: "PRESENT" | "ABSENT_JUSTIFIED";
          notes: string | null;
        }>
      >(`/attendance/${sessionId}/attendance`);
      const map: AttendanceStatus = {};
      for (const record of data) {
        map[record.studentId] = {
          status: record.status,
          notes: record.notes,
        };
      }
      setAttendance(map);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAbsent(studentId: string, notesText?: string) {
    const current = attendance[studentId];
    const isAbsent = current?.status === "ABSENT_JUSTIFIED";

    try {
      if (isAbsent) {
        await apiFetch(`/attendance/${sessionId}/students/${studentId}/present`, {
          method: "POST",
        });
        const updated = { ...attendance };
        delete updated[studentId];
        setAttendance(updated);
      } else {
        await apiFetch(`/attendance/${sessionId}/students/${studentId}/absent`, {
          method: "POST",
          body: JSON.stringify({ notes: notesText || null }),
        });
        setAttendance({
          ...attendance,
          [studentId]: {
            status: "ABSENT_JUSTIFIED",
            notes: notesText || null,
          },
        });
      }
      setSelectedStudentId(null);
      setNotes("");
    } catch {
      alert("No se pudo actualizar la asistencia");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Asistencia</h3>
        {!isInstructor && (
          <button
            type="button"
            onClick={() => void loadAttendance()}
            disabled={loading}
            className="text-xs text-brand-deep hover:underline"
          >
            {loading ? "Cargando..." : "Recargar"}
          </button>
        )}
      </div>

      {enrollments.length === 0 ? (
        <p className="text-sm text-text-secondary">Sin alumnos inscritos.</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {enrollments.map((enrollment) => {
            const isAbsent = attendance[enrollment.student.id]?.status === "ABSENT_JUSTIFIED";
            return (
              <button
                key={enrollment.student.id}
                type="button"
                onClick={() => {
                  if (!isInstructor) {
                    setSelectedStudentId(enrollment.student.id);
                    setNotes(attendance[enrollment.student.id]?.notes || "");
                  }
                }}
                disabled={isInstructor}
                className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-bg-base disabled:cursor-default"
                title={isInstructor ? "Solo Recepción y Dirección pueden marcar" : ""}
              >
                <PersonIcon absent={isAbsent} />
                <span className="text-xs text-text-primary">{enrollment.student.fullName}</span>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={selectedStudentId !== null}
        onClose={() => {
          setSelectedStudentId(null);
          setNotes("");
        }}
        title="Marcar ausencia"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectedStudentId) {
                  void toggleAbsent(selectedStudentId, notes || undefined);
                }
              }}
              className="rounded-md bg-status-error px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {attendance[selectedStudentId!]?.status === "ABSENT_JUSTIFIED"
                ? "Revertir"
                : "Marcar ausente"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStudentId(null);
                setNotes("");
              }}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm text-text-primary hover:bg-bg-base"
            >
              Cancelar
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <textarea
            placeholder="Nota (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
