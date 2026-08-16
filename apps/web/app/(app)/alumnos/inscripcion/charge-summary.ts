export interface ChargeLine {
  concept: string;
  amount: number;
}

export interface ChargeSummary {
  lines: ChargeLine[];
  total: number;
}

export interface ChargeSummaryInput {
  annualFeeAmount: string;
  enrollmentFeeAmount: string;
  /** Falso cuando el alumno ya pago inscripcion alguna vez. */
  chargesEnrollmentFee: boolean;
  billingModality: string;
  monthlyRateAmount: string;
}

function toAmount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Desglose de lo que se va a cobrar al inscribir. Es la pantalla de
 * confirmacion del asistente, y por eso vive aparte del componente: lo que
 * evita la mayoria de los errores merece prueba propia.
 *
 * Solo lista lo que el backend realmente creara. La inscripcion no aparece si
 * el alumno ya la pago, aunque el campo traiga un monto.
 */
export function buildChargeSummary(input: ChargeSummaryInput): ChargeSummary {
  const lines: ChargeLine[] = [];

  const annual = toAmount(input.annualFeeAmount);
  if (annual > 0) {
    lines.push({ concept: "Anualidad", amount: annual });
  }

  const enrollment = toAmount(input.enrollmentFeeAmount);
  if (input.chargesEnrollmentFee && enrollment > 0) {
    lines.push({ concept: "Inscripción", amount: enrollment });
  }

  const monthly = toAmount(input.monthlyRateAmount);
  if (input.billingModality === "MONTHLY" && monthly > 0) {
    lines.push({ concept: "Primera mensualidad", amount: monthly });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, total };
}
