import { Injectable, Logger } from "@nestjs/common";
import { createTransport } from "nodemailer";

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter = createTransport({
    host: process.env.MAILER_HOST,
    port: Number(process.env.MAILER_PORT ?? 587),
    secure: Number(process.env.MAILER_PORT ?? 587) === 465,
    auth: process.env.MAILER_USER
      ? {
          user: process.env.MAILER_USER,
          pass: process.env.MAILER_PASS,
        }
      : undefined,
  });

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.MAILER_FROM || "noreply@vonveria.mx",
        to: email,
        subject: "Restablecer contraseña - VonverIA Swim",
        html: `
          <h2>Restablecer contraseña</h2>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #1FB6A6; color: white; text-decoration: none; border-radius: 4px;">
              Restablecer contraseña
            </a>
          </p>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p>${resetLink}</p>
          <p><em>Este enlace expira en 24 horas.</em></p>
          <p>Si no solicitaste este cambio, ignora este email.</p>
        `,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
