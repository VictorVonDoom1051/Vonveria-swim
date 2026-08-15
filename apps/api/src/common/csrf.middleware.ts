import { randomBytes } from "node:crypto";
import { ForbiddenException, Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../identity/constants";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Doble cookie CSRF: cualquier respuesta asegura que exista la cookie
 * (legible por JS, no httpOnly); las mutaciones deben repetir su valor en
 * un header custom. Un atacante cross-site puede hacer que el navegador
 * mande la cookie de sesion, pero no puede leer la cookie CSRF para
 * copiarla al header (Seccion 15: proteccion CSRF).
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    let csrfCookie = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
    if (!csrfCookie) {
      csrfCookie = randomBytes(24).toString("base64url");
      res.cookie(CSRF_COOKIE_NAME, csrfCookie, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    if (!SAFE_METHODS.has(req.method)) {
      const headerValue = req.header(CSRF_HEADER_NAME);
      if (!headerValue || headerValue !== csrfCookie) {
        throw new ForbiddenException({ errorCode: "CSRF_TOKEN_INVALID" });
      }
    }

    next();
  }
}
