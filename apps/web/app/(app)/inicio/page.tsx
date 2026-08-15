import { Card } from "@vonveria-swim/ui";
import { requireUser } from "../../../lib/session";

export default async function InicioPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-text-primary">
        Hola, {user.fullName.split(" ")[0]}
      </h1>
      <Card className="max-w-xl">
        <p className="text-sm text-text-secondary">
          Las clases del dia, alumnos activos, pagos vencidos e incidencias apareceran aqui a partir
          de M2 y M3, cuando existan alumnos, clases y cobros reales que resumir.
        </p>
      </Card>
    </div>
  );
}
