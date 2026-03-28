export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  static async sendEmail(data: EmailData): Promise<void> {
    // TODO: Publish email event to RabbitMQ for jobs-service to process
    console.log("Email to be sent:", { to: data.to, subject: data.subject });
  }

  static async sendVerificationEmail(
    email: string,
    token: string,
    firstName: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.CORS_ORIGIN || "http://localhost:3000"}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4CAF50;">Verify Your Email Address</h1>
            <p>Hi ${firstName},</p>
            <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    const text = `Hi ${firstName}, verify your email: ${verificationUrl} (expires in 24 hours)`;

    await this.sendEmail({
      to: email,
      subject: "Verify Your Email Address",
      html,
      text,
    });
  }

  static async sendPasswordResetEmail(
    email: string,
    token: string,
    firstName: string,
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f44336;">Reset Your Password</h1>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    const text = `Hi ${firstName}, reset your password: ${resetUrl} (expires in 24 hours)`;

    await this.sendEmail({
      to: email,
      subject: "Reset Your Password",
      html,
      text,
    });
  }
}
