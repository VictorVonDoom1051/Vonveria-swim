import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { IdentityModule } from "./identity/identity.module";
import { OrganizationModule } from "./organization/organization.module";
import { AuditModule } from "./audit/audit.module";
import { FacilitiesModule } from "./facilities/facilities.module";
import { ProgramsModule } from "./programs/programs.module";
import { FamiliesModule } from "./families/families.module";
import { SchedulingModule } from "./scheduling/scheduling.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { BillingModule } from "./billing/billing.module";
import { ReportsModule } from "./reports/reports.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { AuthGuard } from "./identity/guards/auth.guard";
import { CapabilityGuard } from "./identity/guards/capability.guard";
import { CsrfMiddleware } from "./common/csrf.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    AuditModule,
    IdentityModule,
    OrganizationModule,
    FacilitiesModule,
    ProgramsModule,
    FamiliesModule,
    SchedulingModule,
    EnrollmentsModule,
    BillingModule,
    ReportsModule,
    AttendanceModule,
  ],
  providers: [
    // Orden importa: AuthGuard resuelve request.user antes de que CapabilityGuard lo necesite.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: CapabilityGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CsrfMiddleware).forRoutes("*");
  }
}
