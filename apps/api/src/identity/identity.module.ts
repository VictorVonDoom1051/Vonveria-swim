import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { LoginRateLimiterService } from "./login-rate-limiter.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [AuthController, UsersController],
  providers: [AuthService, UsersService, LoginRateLimiterService],
})
export class IdentityModule {}
