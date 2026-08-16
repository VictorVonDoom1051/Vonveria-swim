import { Card } from "@vonveria-swim/ui";
import { formatTime, type LaneState, type OccupancySessionItem, type PoolState } from "./types";

/**
 * Estado de un espacio de alberca en este momento. Un carril ocupado se pinta en
 * turquesa; libre queda claro y, si hay clase mas tarde hoy, dice desde cuando se
 * ocupa, para que la pantalla siga diciendo algo fuera del horario de clases.
 */
function LaneBar({
  label,
  current,
  next,
}: {
  label: string;
  current: OccupancySessionItem | null;
  next: OccupancySessionItem | null;
}) {
  if (current) {
    return (
      <div className="rounded-md border border-brand-turquoise bg-brand-turquoise/10 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            {label}
          </span>
          <span className="text-xs text-text-secondary">hasta {formatTime(current.endsAt)}</span>
        </div>
        <p className="truncate font-medium text-text-primary">{current.group.name}</p>
        {current.group.instructor ? (
          <p className="truncate text-sm text-text-secondary">
            {current.group.instructor.fullName}
          </p>
        ) : (
          <p className="text-sm text-text-secondary">Sin instructor asignado</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border-subtle bg-bg-base p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          {label}
        </span>
      </div>
      <p className="font-medium text-text-secondary">Libre</p>
      {next ? (
        <p className="truncate text-sm text-text-secondary">
          Se ocupa a las {formatTime(next.startsAt)} · {next.group.name}
        </p>
      ) : (
        <p className="text-sm text-text-secondary">Sin clases pendientes hoy</p>
      )}
    </div>
  );
}

export function PoolMap({ pools }: { pools: PoolState[] }) {
  if (pools.length === 0) {
    return (
      <Card>
        <p className="text-sm text-text-secondary">
          Todavia no hay albercas registradas. Direccion puede darlas de alta en Instalaciones.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {pools.map((pool) => {
        const hasLanes = pool.lanes.length > 0;
        return (
          <Card key={pool.id}>
            <div className="mb-3">
              <h2 className="font-medium text-text-primary">{pool.name}</h2>
              <p className="text-xs text-text-secondary">{pool.branchName}</p>
            </div>

            <div className="flex flex-col gap-2">
              {hasLanes ? (
                pool.lanes.map((lane: LaneState) => (
                  <LaneBar
                    key={lane.id}
                    label={lane.name}
                    current={lane.current}
                    next={lane.next}
                  />
                ))
              ) : (
                <LaneBar
                  label="Alberca completa"
                  current={pool.poolLevel.current}
                  next={pool.poolLevel.next}
                />
              )}

              {/* Una clase sin carril ocupa la alberca aunque tenga carriles. */}
              {hasLanes && (pool.poolLevel.current || pool.poolLevel.next) ? (
                <LaneBar
                  label="Sin carril asignado"
                  current={pool.poolLevel.current}
                  next={pool.poolLevel.next}
                />
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
