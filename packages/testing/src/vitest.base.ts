import type { UserConfig } from "vitest/config";

/**
 * Referencia de la configuracion base de Vitest usada por convencion en todo
 * el monorepo (ver test.* en cada vitest.config.ts de apps/packages).
 *
 * No se importa directamente desde los vitest.config.ts: Vite externaliza
 * los paquetes de workspace resueltos via node_modules al cargar el archivo
 * de configuracion, y Node no sabe mapear el especificador ".js" a la fuente
 * ".ts" fuera de un bundler. Cada config replica estas mismas opciones
 * inline para evitar esa limitacion.
 */
export const baseVitestConfig: UserConfig = {
  test: {
    globals: false,
    restoreMocks: true,
    reporters: "default",
  },
};
