import { Controller, Get, HttpException, HttpStatus, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Public } from "../identity/decorators/public.decorator";

@Controller()
@Public()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  // @Inject() explicito: ver docs/decisions/0001-nestjs-explicit-inject.md.
  // tsx/esbuild no emiten metadata de decoradores, asi que la inyeccion
  // por tipo inferido (design:paramtypes) llega undefined en runtime.
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Liveness: el proceso esta arriba, sin depender de servicios externos. */
  @Get("health")
  getHealth() {
    return { status: "ok", service: "api", timestamp: new Date().toISOString() };
  }

  /** Readiness: el proceso puede atender trafico real (DB alcanzable). */
  @Get("ready")
  async getReady() {
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return { status: "ok", database: "reachable", timestamp: new Date().toISOString() };
    } catch (error: unknown) {
      this.logger.error("Readiness check fallo: base de datos inalcanzable", error);
      throw new HttpException(
        {
          status: "unavailable",
          database: "unreachable",
          errorCode: "READINESS_DB_UNREACHABLE",
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
