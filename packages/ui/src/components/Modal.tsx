import type { ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Overlay simple, sin dependencias externas. El resto de la pagina que lo
 * abre debe marcarse con `print:hidden` (ver /pagos/corte); este componente
 * en si NUNCA lleva esa clase, o Ctrl+P imprimiria una hoja en blanco.
 */
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:static print:block print:bg-white print:p-0"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-border-subtle bg-bg-surface p-5 shadow-sm print:max-h-none print:w-auto print:max-w-none print:border-0 print:p-0 print:shadow-none"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md px-2 py-1 text-sm text-text-secondary hover:bg-bg-base print:hidden"
          >
            Cerrar
          </button>
        </div>
        <div className="overflow-y-auto print:overflow-visible">{children}</div>
        {footer ? <div className="mt-4 flex justify-end gap-2 print:hidden">{footer}</div> : null}
      </div>
    </div>
  );
}
