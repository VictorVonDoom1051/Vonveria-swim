# Arranque en Windows (M0)

Guia para levantar VonverIA Swim localmente en Windows usando PowerShell.

## Requisitos previos

- Node.js 24 LTS (ver `.nvmrc` en la raiz).
- pnpm, habilitado via Corepack (viene con Node).
- Docker Desktop (para Postgres local).
- Git.

Verifica versiones:

```powershell
node -v
corepack enable
pnpm -v
docker -v
```

## 1. Clonar y configurar variables de entorno

```powershell
Copy-Item .env.example .env
```

Los valores por defecto de `.env.example` ya funcionan con el `docker-compose.yml` incluido; no necesitas cambiar nada para desarrollo local.

## 2. Instalar dependencias

```powershell
pnpm install
```

## 3. Levantar Postgres local

```powershell
docker compose up -d
```

Verifica que el contenedor este saludable:

```powershell
docker compose ps
```

## 4. Generar el cliente de Prisma y aplicar la primera migracion

```powershell
pnpm db:generate
pnpm db:migrate
```

`db:migrate` te pedira un nombre para la migracion la primera vez (usa algo como `init`). Estos comandos cargan `.env` desde la raiz del repo automaticamente (via `dotenv-cli`), sin importar el cwd interno de pnpm.

(Opcional) cargar el seed minimo:

```powershell
pnpm db:seed
```

## 5. Levantar las aplicaciones

En una sola terminal, todas a la vez:

```powershell
pnpm dev
```

O por separado, en terminales distintas:

```powershell
pnpm --filter @vonveria-swim/api dev
pnpm --filter @vonveria-swim/web dev
pnpm --filter @vonveria-swim/worker dev
```

- Web: http://localhost:3100
- API health: http://localhost:3001/health
- API readiness: http://localhost:3001/ready

## 6. Verificar calidad antes de hacer commit

```powershell
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
```

## Problemas comunes

- **Puerto 3100 ocupado:** `apps/web` usa 3100 (no el 3000 por defecto de Next.js) para no chocar con otro proyecto local que ya use ese puerto. Cambialo en `apps/web/package.json` y en `.env` si lo necesitas distinto.
- **Puerto 5433 ocupado:** el proyecto usa 5433 en el host (no el 5432 por defecto de Postgres) precisamente para no chocar con otro Postgres local (por ejemplo, el de otro proyecto en Docker). Si aun asi esta ocupado, cambia el puerto en `docker-compose.yml` y en `DATABASE_URL` de `.env`.
- **Docker Desktop no arranca:** en el primer uso puede pedir aceptar terminos o completar un asistente desde su ventana; ábrelo manualmente una vez y espera a que el icono de la bandeja muestre "Docker Desktop is running".
- **`pnpm` no reconocido:** ejecuta `corepack enable` y abre una nueva terminal.
- **Prisma no encuentra `DATABASE_URL`:** confirma que copiaste `.env.example` a `.env` en la raiz del repo.
