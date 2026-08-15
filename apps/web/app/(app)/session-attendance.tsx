"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@vonveria-swim/ui";
import { apiFetch } from "../../lib/api-client";

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
      fill="currentColor"
      stroke="none"
      className={absent ? "text-status-error" : "text-status-success"}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3" />
      <path d="M 12 15 C 8 15 5 17 5 20 L 19 20 C 19 17 16 15 12 15 Z" />
    </svg>
  );
}

/**
 * Lista de alumnos de una sesion con su aviso de falta.
 *
 * canMark refleja la capacidad billing:manage que exige el backend. Cuando es
 * false los iconos se ven igual pero no se pueden tocar: el instructor consulta
 * su lista, Recepcion y Direccion registran el aviso del familiar.
 */
export function SessionAttendance({
  sessionId,
  enrollments,
  canMark,
}: {
  sessionId: string;
  enrollments: Enrollment[];
  canMark: boolean;
}) {
  const [attendance, setAttendance] = useState<AttendanceStatus>({});
  const [loading, setLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<
        Array<{ studentId: string; status: "PRESENT" | "ABSENT_JUSTIFIED"; notes: string | null }>
      >(`/attendance/${sessionId}/attendance`);
      const map: AttendanceStatus = {};
      for (const record of data) {
        map[record.studentId] = { status: record.status, notes: record.notes };
      }
      setAttendance(map);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Sin esto una falta ya registrada se veria verde hasta recargar a mano.
  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  async function toggleAbsent(studentId: string, notesText?: string) {
    const isAbsent = attendance[studentId]?.status === "ABSENT_JUSTIFIED";

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
          [studentId]: { status: "ABSENT_JUSTIFIED", notes: notesText || null },
        });
      }
      setSelectedStudentId(null);
      setNotes("");
    } catch {
      alert("No se pudo actualizar la asistencia");
    }
  }

  const absentCount = Object.values(attendance).filter(
    (record) => record.status === "ABSENT_JUSTIFIED",
  ).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Asistencia
          {absentCount > 0 && (
            <span className="ml-2 font-normal text-status-error">
              {absentCount} {absentCount === 1 ? "ausente" : "ausentes"}
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={() => void loadAttendance()}
          disabled={loading}
          className="text-xs text-brand-deep hover:underline"
        >
          {loading ? "Cargando..." : "Recargar"}
        </button>
      </div>

      {enrollments.length === 0 ? (
        <p className="text-sm text-text-secondary">Sin alumnos inscritos.</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {enrollments.map((enrollment) => {
            const record = attendance[enrollment.student.id];
            const isAbsent = record?.status === "ABSENT_JUSTIFIED";
            return (
              <button
                key={enrollment.student.id}
                type="button"
                onClick={() => {
                  if (canMark) {
                    setSelectedStudentId(enrollment.student.id);
                    setNotes(record?.notes ?? "");
                  }
                }}
                disabled={!canMark}
                className="flex min-w-20 flex-col items-center gap-1 rounded-lg p-2 hover:bg-bg-base disabled:cursor-default"
                title={
                  canMark
                    ? isAbsent
                      ? `Ausente${record?.notes ? `: ${record.notes}` : ""}`
                      : "Marcar que no asistira"
                    : "Solo Recepción y Dirección pueden marcar"
                }
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
              {selectedStudentId && attendance[selectedStudentId]?.status === "ABSENT_JUSTIFIED"
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
            placeholder="Motivo del aviso del familiar (opcional)"
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
