import LoginHistory, { ILoginHistory } from "../models/LoginHistory";
import User from "../models/User";
import { DeviceInfo } from "../utils/deviceInfo";
import { EmailService } from "./emailService";

export interface LoginContext {
  userId: string;
  ip: string;
  deviceInfo: DeviceInfo;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface SuspiciousCheckResult {
  isSuspicious: boolean;
  reasons: string[];
}

/**
 * Security service for detecting suspicious login activity
 */
export class SecurityService {
  /**
   * Check if login is suspicious based on history
   */
  static async checkSuspiciousLogin(
    context: LoginContext,
  ): Promise<SuspiciousCheckResult> {
    const reasons: string[] = [];

    // Get recent login history (last 10 logins)
    const recentLogins = await LoginHistory.findByUserId(context.userId, 10);

    // Check for new IP address
    const hasSeenIP = recentLogins.some((login) => login.ip === context.ip);
    if (!hasSeenIP && recentLogins.length > 0) {
      reasons.push("New IP address");
    }

    // Check for new device
    const hasSeenDevice = recentLogins.some(
      (login) =>
        login.deviceType === context.deviceInfo.deviceType &&
        login.userAgent === context.deviceInfo.userAgent,
    );
    if (!hasSeenDevice && recentLogins.length > 0) {
      reasons.push("New device");
    }

    // Check for unusual login time (login outside normal hours)
    const currentHour = new Date().getHours();
    const isUnusualTime = currentHour < 6 || currentHour > 23; // Between 11 PM and 6 AM
    if (isUnusualTime) {
      reasons.push("Unusual login time");
    }

    // Check for rapid successive logins from different locations
    if (recentLogins.length >= 2) {
      const lastLogin = recentLogins[0];
      const timeDiff = Date.now() - lastLogin.loginAt.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      if (
        minutesDiff < 60 &&
        lastLogin.location?.country &&
        context.location?.country &&
        lastLogin.location.country !== context.location.country
      ) {
        reasons.push(
          "Rapid login from different location (possible account compromise)",
        );
      }
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Record login attempt in history
   */
  static async recordLogin(
    context: LoginContext,
    suspiciousResult: SuspiciousCheckResult,
  ): Promise<void> {
    await LoginHistory.create({
      userId: context.userId,
      ip: context.ip,
      userAgent: context.deviceInfo.userAgent,
      deviceType: context.deviceInfo.deviceType,
      location: context.location,
      loginAt: new Date(),
      suspicious: suspiciousResult.isSuspicious,
      suspiciousReasons: suspiciousResult.reasons,
    });
  }

  /**
   * Send suspicious login alert email
   */
  static async sendSuspiciousLoginAlert(
    userId: string,
    reasons: string[],
    loginContext: LoginContext,
  ): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Suspicious Login Detected</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f44336;">⚠️ Suspicious Login Detected</h1>
            <p>Hi ${user.firstName},</p>
            <p>We detected a suspicious login attempt on your account:</p>
            <ul>
              ${reasons.map((reason) => `<li>${reason}</li>`).join("")}
            </ul>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Login Details:</strong></p>
              <p>IP Address: ${loginContext.ip}</p>
              <p>Device: ${loginContext.deviceInfo.deviceType || "Unknown"}</p>
              ${loginContext.location?.country ? `<p>Location: ${loginContext.location.city || ""} ${loginContext.location.country}</p>` : ""}
              <p>Time: ${new Date().toLocaleString()}</p>
            </div>
            <p>If this was you, you can ignore this email.</p>
            <p><strong>If this wasn't you, please:</strong></p>
            <ol>
              <li>Change your password immediately</li>
              <li>Review your account activity</li>
              <li>Log out from all devices</li>
              <li>Contact support if needed</li>
            </ol>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">This is an automated security alert, please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Suspicious Login Detected

      Hi ${user.firstName},

      We detected a suspicious login attempt on your account:
      ${reasons.map((reason) => `- ${reason}`).join("\n")}

      Login Details:
      IP Address: ${loginContext.ip}
      Device: ${loginContext.deviceInfo.deviceType || "Unknown"}
      ${loginContext.location?.country ? `Location: ${loginContext.location.city || ""} ${loginContext.location.country}` : ""}
      Time: ${new Date().toLocaleString()}

      If this was you, you can ignore this email.

      If this wasn't you, please:
      1. Change your password immediately
      2. Review your account activity
      3. Log out from all devices
      4. Contact support if needed
    `;

    await EmailService.sendEmail({
      to: user.email,
      subject: "⚠️ Suspicious Login Detected",
      html,
      text,
    });
  }

  /**
   * Get user's login history
   */
  static async getUserLoginHistory(
    userId: string,
    limit: number = 20,
  ): Promise<ILoginHistory[]> {
    return LoginHistory.findByUserId(userId, limit);
  }
}
