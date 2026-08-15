import Link from "next/link";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { Card } from "@vonveria-swim/ui";
import { requireCapability, serverFetch } from "../../../../lib/session";

interface AuditItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor: { id: string; fullName: string; email: string } | null;
}

interface AuditListResponse {
  items: AuditItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default async function AuditSettingsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await requireCapability(CAPABILITIES.AUDIT_VIEW);
  const page = Math.max(1, Number(searchParams.page) || 1);
  const data = await serverFetch<AuditListResponse>(`/audit?page=${page}&pageSize=25`);

  if (!data) {
    return <p className="text-sm text-status-error">No se pudo cargar la auditoria.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <Card className="max-w-4xl overflow-x-auto">
      <h1 className="mb-4 text-lg font-semibold text-text-primary">Auditoria</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-text-secondary">
            <th className="py-2 pr-4 font-medium">Fecha</th>
            <th className="py-2 pr-4 font-medium">Actor</th>
            <th className="py-2 pr-4 font-medium">Accion</th>
            <th className="py-2 pr-4 font-medium">Entidad</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id} className="border-b border-border-subtle last:border-0">
              <td className="whitespace-nowrap py-2 pr-4">
                {new Date(item.createdAt).toLocaleString("es-MX")}
              </td>
              <td className="py-2 pr-4">{item.actor?.fullName ?? "Sistema"}</td>
              <td className="py-2 pr-4 font-mono text-xs">{item.action}</td>
              <td className="py-2 pr-4 text-text-secondary">{item.entityType}</td>
            </tr>
          ))}
          {data.items.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-text-secondary">
                Sin registros todavia.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <PageLink page={page - 1} disabled={page <= 1} label="Anterior" />
          <span className="text-text-secondary">
            Pagina {page} de {totalPages}
          </span>
          <PageLink page={page + 1} disabled={page >= totalPages} label="Siguiente" />
        </div>
      ) : null}
    </Card>
  );
}

function PageLink({ page, disabled, label }: { page: number; disabled: boolean; label: string }) {
  if (disabled) {
    return <span className="text-text-secondary opacity-50">{label}</span>;
  }
  return (
    <Link href={`/settings/audit?page=${page}`} className="text-brand-deep underline">
      {label}
    </Link>
  );
}
