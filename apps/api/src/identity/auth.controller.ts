import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { SESSION_COOKIE_NAME } from "./constants";
import type { AuthenticatedUser } from "./types";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto.email, dto.password, {
      userAgent: req.header("user-agent"),
      ipAddress: req.ip,
    });

    res.cookie(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: result.expiresAt,
      path: "/",
    });

    return { user: result.user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600 } })
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: { email: string }): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(dto.email);
    return { message: "Si existe una cuenta, recibirás un email de recuperación" };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post("reset-password-confirm")
  @HttpCode(HttpStatus.OK)
  async resetPasswordConfirm(
    @Body() dto: { token: string; newPassword: string },
  ): Promise<{ message: string }> {
    await this.authService.resetPasswordWithToken(dto.token, dto.newPassword);
    return { message: "Contraseña actualizada exitosamente" };
  }
}
