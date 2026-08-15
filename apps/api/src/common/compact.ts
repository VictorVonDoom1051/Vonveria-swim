/**
 * Quita las claves con valor `undefined` de un objeto antes de pasarlo como
 * `data` a Prisma. Necesario porque `tsconfig.base.json` tiene
 * `exactOptionalPropertyTypes: true`: un campo opcional de Prisma
 * (`birthDate?: Date | null`) no acepta que se le asigne literalmente
 * `undefined`, solo que la clave este ausente.
 */
export function compact<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
