import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@vonveria-swim/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { UpdateOrganizationDto } from "./dto/update-organization.dto";
import type { UpdateBrandingDto } from "./dto/update-branding.dto";

/** Quita las claves undefined antes de guardar un DTO parcial como Json de auditoria. */
function toJsonMetadata(value: object): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * Sin correlacionar por dominio/subdominio todavia: cada instalacion del
   * piloto es una sola organizacion (Seccion 9), asi que "la primera" es
   * inequivocamente la organizacion de esta base de datos.
   */
  async getPublicBranding() {
    const organization = await this.prisma.client.organization.findFirstOrThrow({
      include: { branding: true },
    });
    return { name: organization.name, branding: organization.branding };
  }

  getForOrganization(organizationId: string) {
    return this.prisma.client.organization.findUniqueOrThrow({
      where: { id: organizationId },
      include: { branding: true },
    });
  }

  async update(organizationId: string, actorUserId: string, dto: UpdateOrganizationDto) {
    const organization = await this.prisma.client.organization.update({
      where: { id: organizationId },
      data: dto,
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "organization.update",
      entityType: "Organization",
      entityId: organizationId,
      metadata: toJsonMetadata(dto),
    });

    return organization;
  }

  async updateBranding(organizationId: string, actorUserId: string, dto: UpdateBrandingDto) {
    const branding = await this.prisma.client.brandingSettings.update({
      where: { organizationId },
      data: dto,
    });

    await this.audit.record({
      organizationId,
      actorUserId,
      action: "organization.branding_update",
      entityType: "BrandingSettings",
      entityId: branding.id,
      metadata: toJsonMetadata(dto),
    });

    return branding;
  }
}
