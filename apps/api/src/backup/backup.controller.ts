import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { CAPABILITIES, type Capability } from "@vonveria-swim/permissions";
import { BackupService, type CsvDataset } from "./backup.service";
import { RequireCapability } from "../identity/decorators/require-capability.decorator";
import { CurrentUser } from "../identity/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../identity/types";

/** Cada listado exige la capacidad de su modulo, no una capacidad nueva. */
const DATASET_CAPABILITY: Record<CsvDataset, Capability> = {
  alumnos: CAPABILITIES.STUDENTS_MANAGE,
  pagos: CAPABILITIES.BILLING_MANAGE,
  asistencias: CAPABILITIES.STUDENTS_MANAGE,
  inventario: CAPABILITIES.INVENTORY_MANAGE,
};

function fileStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

@Controller("backup")
export class BackupController {
  constructor(@Inject(BackupService) private readonly backup: BackupService) {}

  /** Solo Direccion: el respaldo trae datos de menores y de cobranza. */
  @RequireCapability(CAPABILITIES.ORGANIZATION_MANAGE)
  @Get("export")
  async exportAll(@CurrentUser() user: AuthenticatedUser, @Res() response: Response) {
    const data = await this.backup.exportAll(user.organizationId);

    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="respaldo-vonveria-${fileStamp()}.json"`,
    );
    response.send(JSON.stringify(data, null, 2));
  }

  @Get("csv/:dataset")
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Param("dataset") dataset: string,
    @Res() response: Response,
  ) {
    const required = DATASET_CAPABILITY[dataset as CsvDataset];
    if (!required) {
      throw new BadRequestException({ errorCode: "UNKNOWN_DATASET" });
    }
    // La capacidad depende del listado pedido, asi que se verifica aqui en vez
    // de con el decorador, que es estatico por endpoint.
    if (!user.capabilities.includes(required)) {
      throw new ForbiddenException({ errorCode: "FORBIDDEN_DATASET" });
    }

    const csv = await this.backup.buildCsvDataset(user.organizationId, dataset as CsvDataset);

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${dataset}-${fileStamp()}.csv"`,
    );
    response.send(csv);
  }
}
