import "reflect-metadata";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

// pnpm ejecuta este script con cwd=apps/api, no la raiz del repo,
// asi que el .env compartido no se carga solo. Se resuelve por ruta
// de archivo, no por cwd, para que funcione sin importar como se invoque.
const rootEnvPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
if (existsSync(rootEnvPath)) {
  process.loadEnvFile(rootEnvPath);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["log", "warn", "error"],
  });

  // Railway (y cualquier PaaS) sirve detras de un reverse proxy. Sin esto,
  // req.ip es la IP del proxy en TODAS las peticiones y el rate limiting
  // global agrupa a toda la organizacion en una sola cubeta. El valor 1
  // confia en un solo salto: usar `true` permitiria falsificar X-Forwarded-For.
  app.set("trust proxy", 1);

  const corsOrigin = process.env.API_CORS_ORIGIN ?? "http://localhost:3100";
  app.enableCors({ origin: corsOrigin, credentials: true });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);

  Logger.log(`apps/api escuchando en http://localhost:${port}`, "Bootstrap");
}

bootstrap().catch((error: unknown) => {
  Logger.error("Error fatal al iniciar apps/api", error instanceof Error ? error.stack : error);
  process.exit(1);
});
