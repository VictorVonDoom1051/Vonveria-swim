import { Card } from "@vonveria-swim/ui";

/** Destino real en la navegacion (Seccion 5), sin fingir funcionalidad que aun no existe. */
export function ComingSoon({ title, milestone }: { title: string; milestone: string }) {
  return (
    <Card className="max-w-xl">
      <h1 className="mb-2 text-lg font-semibold text-text-primary">{title}</h1>
      <p className="text-sm text-text-secondary">
        Esta seccion todavia no esta disponible. Esta planeada para el hito {milestone}.
      </p>
    </Card>
  );
}
