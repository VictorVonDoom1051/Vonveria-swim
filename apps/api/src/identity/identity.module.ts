import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { AuditModule } from "../audit/audit.module";
import { MailerService } from "../common/mailer.service";

@Module({
  imports: [AuditModule],
  controllers: [AuthController, UsersController],
  providers: [AuthService, UsersService, MailerService],
})
export class IdentityModule {}
