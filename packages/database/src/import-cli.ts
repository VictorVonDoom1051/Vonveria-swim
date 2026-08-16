import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getPrismaClient } from "./index";
import { importBackup } from "./import";

/**
 * Restaurar un respaldo. Operacion de emergencia que ejecuta el fabricante.
 *
 *   pnpm db:import archivo.json
 *   pnpm db:import archivo.json --replace --yes
 *
 * Sin --replace se detiene si la escuela ya existe, en vez de pisarla.
 */

function hostFromDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "(DATABASE_URL sin definir)";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
  } catch {
    return "(DATABASE_URL ilegible)";
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filePath = args.find((arg) => !arg.startsWith("--"));
  const replace = args.includes("--replace");
  const confirmed = args.includes("--yes");

  if (!filePath) {
    console.error("Uso: pnpm db:import <archivo.json> [--replace --yes]");
    process.exitCode = 1;
    return;
  }

  const absolutePath = resolve(process.cwd(), filePath);
  if (!existsSync(absolutePath)) {
    console.error(`No existe el archivo: ${absolutePath}`);
    process.exitCode = 1;
    return;
  }

  if (replace && !confirmed) {
    console.error(
      "--replace BORRA la escuela existente en la base destino antes de restaurar.\n" +
        "Si es lo que quieres, agrega tambien --yes.",
    );
    process.exitCode = 1;
    return;
  }

  const backup = JSON.parse(readFileSync(absolutePath, "utf8"));

  console.log(`Archivo:  ${absolutePath}`);
  console.log(`Escuela:  ${backup?.organization?.name ?? "(desconocida)"}`);
  console.log(`Exportado: ${backup?.meta?.exportedAt ?? "(sin fecha)"}`);
  console.log(`Destino:  ${hostFromDatabaseUrl()}`);
  console.log(replace ? "Modo:     REEMPLAZAR (destructivo)\n" : "Modo:     solo si no existe\n");

  const prisma = getPrismaClient();
  try {
    const summary = await importBackup(prisma, backup, { replace });

    console.log(summary.replaced ? "Escuela reemplazada." : "Escuela restaurada.");
    for (const [entity, count] of Object.entries(summary.counts)) {
      if (count > 0) console.log(`  ${entity}: ${count}`);
    }

    console.log("");
    if (summary.adminEmail) {
      console.log(`Direccion puede entrar con ${summary.adminEmail} y ADMIN_PASSWORD.`);
    } else {
      console.log("ADMIN_EMAIL no esta definida: ningun usuario puede entrar todavia.");
    }
    console.log(
      "El resto de los usuarios necesita que Direccion les restablezca la contrasena " +
        "desde Configuracion -> Usuarios.",
    );
  } catch (error) {
    console.error("\nLa restauracion fallo y no se escribio nada:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
