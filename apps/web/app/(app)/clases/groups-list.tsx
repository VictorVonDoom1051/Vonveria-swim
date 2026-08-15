import Link from "next/link";
import { Button, Card, StatusBadge } from "@vonveria-swim/ui";
import type { GroupListItem } from "./types";

export function GroupsList({ groups }: { groups: GroupListItem[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-text-primary">Clases</h1>
        <Link href="/clases/nuevo">
          <Button>Nuevo grupo</Button>
        </Link>
      </div>

      <Card className="max-w-4xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th className="py-2 pr-4 font-medium">Grupo</th>
              <th className="py-2 pr-4 font-medium">Programa / Nivel</th>
              <th className="py-2 pr-4 font-medium">Sucursal</th>
              <th className="py-2 pr-4 font-medium">Instructor</th>
              <th className="py-2 pr-4 font-medium">Cupo</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-b border-border-subtle last:border-0">
                <td className="py-2 pr-4">
                  <Link href={`/clases/${group.id}`} className="text-brand-deep underline">
                    {group.name}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  {group.program.name} / {group.level.name}
                </td>
                <td className="py-2 pr-4">
                  {group.branch.name} · {group.pool.name}
                  {group.lane ? ` · ${group.lane.name}` : ""}
                </td>
                <td className="py-2 pr-4">{group.instructor?.fullName ?? "Sin asignar"}</td>
                <td className="py-2 pr-4">
                  {group._count.enrollments}/{group.capacity}
                </td>
                <td className="py-2 pr-4">
                  <StatusBadge tone={group.isPublished ? "success" : "attention"}>
                    {group.isPublished ? "Publicado" : "Borrador"}
                  </StatusBadge>
                </td>
              </tr>
            ))}
            {groups.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-text-secondary">
                  Sin grupos todavia.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
