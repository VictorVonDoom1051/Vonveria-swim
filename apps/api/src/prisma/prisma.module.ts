import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/**
 * Global: una sola instancia de PrismaService (y por lo tanto de
 * PrismaClient) para todo el proceso. Sin esto, cada modulo que la
 * declarara en sus propios "providers" crearia su propia instancia y
 * dispararia $connect/$disconnect por separado.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
