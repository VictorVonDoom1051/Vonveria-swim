import { Module } from "@nestjs/common";
import { ProgramsController } from "./programs.controller";
import { ProgramsService } from "./programs.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [ProgramsController],
  providers: [ProgramsService],
})
export class ProgramsModule {}
