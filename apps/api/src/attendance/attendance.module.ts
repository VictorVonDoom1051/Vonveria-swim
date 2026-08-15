import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditModule } from "../audit/audit.module";
import { AttendanceService } from "./attendance.service";
import { AttendanceController } from "./attendance.controller";

@Module({
  imports: [AuditModule],
  providers: [PrismaService, AttendanceService],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
