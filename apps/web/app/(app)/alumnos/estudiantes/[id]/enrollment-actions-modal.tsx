"use client";

import { useState } from "react";
import { Button, Card } from "@vonveria-swim/ui";

export interface EnrollmentAction {
  status: "CANCELLED" | "FROZEN" | "TRANSFERRED";
  label: string;
  description: string;
}

const ENROLLMENT_ACTIONS: Record<string, EnrollmentAction> = {
  CANCELLED: {
    status: "CANCELLED",
    label: "Dar de baja",
    description: "El alumno se retira. Se cancela cualquier cobro recurrente.",
  },
  FROZEN: {
    status: "FROZEN",
    label: "Congelar",
    description: "Se pausa la inscripción temporalmente. Los cargos automáticos cesan.",
  },
  TRANSFERRED: {
    status: "TRANSFERRED",
    label: "Cambio de grupo",
    description: "El alumno se transfiere a otro grupo.",
  },
};

const CANCELLATION_REASONS = [
  "El alumno se retira",
  "Cambio de nivel",
  "Pausa temporal",
  "Otro",
];

export function EnrollmentActionsModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  enrollmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (toStatus: string, reason: string, description: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const selectedActionData = selectedAction ? ENROLLMENT_ACTIONS[selectedAction] : null;

  const handleSubmit = async () => {
    if (!selectedAction || !reason) {
      setError("Selecciona acción y motivo");
      return;
    }
    setError("");
    try {
      await onSubmit(selectedAction, reason, description);
      setSelectedAction(null);
      setReason("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Cambiar estado de inscripción</h2>

        {!selectedAction ? (
          <div className="space-y-2">
            {Object.entries(ENROLLMENT_ACTIONS).map(([key, action]) => (
              <button
                key={key}
                onClick={() => setSelectedAction(key)}
                className="w-full rounded-md border border-border-subtle p-3 text-left transition hover:border-border-strong hover:bg-background-secondary"
              >
                <p className="font-medium text-text-primary">{action.label}</p>
                <p className="text-sm text-text-secondary">{action.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 font-medium text-text-primary">{selectedActionData?.label}</p>
              <p className="text-sm text-text-secondary">{selectedActionData?.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary">Motivo *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-subtle bg-background-secondary px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Selecciona...</option>
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary">Detalles adicionales</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional: información extra sobre el cambio..."
                className="mt-1 w-full rounded-md border border-border-subtle bg-background-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary"
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-status-error">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedAction(null);
                  setReason("");
                  setDescription("");
                  setError("");
                }}
                className="flex-1 rounded-md border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition hover:border-border-strong"
              >
                Atrás
              </button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !reason}
                className="flex-1"
              >
                {isLoading ? "Guardando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-secondary transition hover:text-text-primary"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </Card>
    </div>
  );
}
