import { Card } from "@vonveria-swim/ui";
import { CAPABILITIES, type Capability } from "@vonveria-swim/permissions";
import { requireCapability } from "../../../../lib/session";

interface CsvDataset {
  slug: string;
  label: string;
  description: string;
  capability: Capability;
}

const DATASETS: CsvDataset[] = [
  {
    slug: "alumnos",
    label: "Alumnos",
    description: "Nombre, fecha de nacimiento, alertas medicas, tutor, grupo y nivel.",
    capability: CAPABILITIES.STUDENTS_MANAGE,
  },
  {
    slug: "pagos",
    label: "Pagos",
    description: "Fecha, alumno, monto, metodo y a que cargos se aplico.",
    capability: CAPABILITIES.BILLING_MANAGE,
  },
  {
    slug: "asistencias",
    label: "Asistencias",
    description: "Faltas avisadas por clase, con su nota.",
    capability: CAPABILITIES.STUDENTS_MANAGE,
  },
  {
    slug: "inventario",
    label: "Inventario",
    description: "Productos con precio y existencias actuales.",
    capability: CAPABILITIES.INVENTORY_MANAGE,
  },
];

export default async function BackupPage() {
  const user = await requireCapability(CAPABILITIES.ORGANIZATION_MANAGE);
  const available = DATASETS.filter((dataset) => user.capabilities.includes(dataset.capability));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Respaldos</h1>
        <p className="text-sm text-text-secondary">
          Descarga la informacion de la escuela para conservarla fuera del sistema.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-secondary">Respaldo completo</h2>
        <Card className="max-w-2xl">
          <p className="mb-3 text-sm text-text-secondary">
            Un solo archivo con toda la escuela: alumnos, familias, clases, inscripciones, cobranza,
            asistencias e inventario. Guardalo en un lugar seguro y renuevalo cada semana.
          </p>
          <p className="mb-4 text-sm text-text-secondary">
            <strong className="text-text-primary">No incluye contrasenas.</strong> Si algun dia hay
            que restaurarlo, cada usuario necesitara una contrasena nueva.
          </p>
          <a
            href="/api/backup/export"
            className="inline-flex items-center rounded-md bg-brand-deep px-4 py-2 text-sm font-medium text-text-inverse hover:bg-brand-deep-dark"
          >
            Descargar respaldo completo
          </a>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-secondary">Listados para Excel</h2>
        <p className="text-sm text-text-secondary">
          Archivos CSV que abren directo en Excel, para consultar o imprimir.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {available.map((dataset) => (
            <Card key={dataset.slug}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-text-primary">{dataset.label}</h3>
                  <p className="text-sm text-text-secondary">{dataset.description}</p>
                </div>
                <a
                  href={`/api/backup/csv/${dataset.slug}`}
                  className="whitespace-nowrap rounded-md border border-border-subtle px-3 py-2 text-sm text-text-primary hover:bg-bg-base"
                >
                  Descargar
                </a>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
