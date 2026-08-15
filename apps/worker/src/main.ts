import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getPrismaClient } from "@vonveria-swim/database";
import { buildHeartbeatPayload } from "./heartbeat";
import { runMonthlyFeeGeneration } from "./monthly-fees";

// pnpm ejecuta este script con cwd=apps/worker, no la raiz del repo,
// asi que el .env compartido no se carga solo. Se resuelve por ruta
// de archivo, no por cwd, para que funcione sin importar como se invoque.
const rootEnvPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
if (existsSync(rootEnvPath)) {
  process.loadEnvFile(rootEnvPath);
}

const intervalMs = Number(process.env.WORKER_HEARTBEAT_INTERVAL_MS ?? 60_000);
const monthlyFeeIntervalMs = Number(process.env.WORKER_MONTHLY_FEE_INTERVAL_MS ?? 24 * 60 * 60 * 1000);
const prisma = getPrismaClient();

async function runHeartbeat(): Promise<void> {
  const payload = buildHeartbeatPayload(new Date());

  await prisma.appMetadata.upsert({
    where: { key: payload.key },
    update: { value: payload.value },
    create: payload,
  });

  console.log(`[worker] heartbeat registrado en ${payload.value}`);
}

async function runMonthlyFees(): Promise<void> {
  const created = await runMonthlyFeeGeneration(prisma, new Date());
  console.log(`[worker] mensualidades generadas: ${created}`);
}

async function main(): Promise<void> {
  console.log(`[worker] iniciado, intervalo de heartbeat: ${intervalMs}ms`);

  await runHeartbeat();
  const timer = setInterval(() => {
    runHeartbeat().catch((error: unknown) => {
      console.error("[worker] fallo al registrar heartbeat", error);
    });
  }, intervalMs);

  await runMonthlyFees().catch((error: unknown) => {
    console.error("[worker] fallo al generar mensualidades", error);
  });
  const monthlyFeeTimer = setInterval(() => {
    runMonthlyFees().catch((error: unknown) => {
      console.error("[worker] fallo al generar mensualidades", error);
    });
  }, monthlyFeeIntervalMs);

  const shutdown = async (signal: string) => {
    console.log(`[worker] recibida ${signal}, cerrando...`);
    clearInterval(timer);
    clearInterval(monthlyFeeTimer);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  console.error("[worker] error fatal al iniciar", error);
  process.exit(1);
});
