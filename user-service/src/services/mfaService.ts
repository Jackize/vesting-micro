import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

/**
 * MFA Service for TOTP (Time-based One-Time Password) authentication
 * Compatible with Google Authenticator and similar apps
 */
export class MfaService {
  /**
   * Generate a new MFA secret
   */
  static generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate TOTP token from secret
   */
  static generateToken(secret: string): string {
    return authenticator.generate(secret);
  }

  /**
   * Verify TOTP token
   */
  static verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({
        token,
        secret,
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate QR code data URL for MFA setup
   */
  static async generateQRCode(
    secret: string,
    email: string,
    serviceName: string = "Vestify",
  ): Promise<string> {
    const otpAuthUrl = authenticator.keyuri(email, serviceName, secret);

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify backup code and remove it if valid
   */
  static verifyAndRemoveBackupCode(
    code: string,
    backupCodes: string[],
  ): { isValid: boolean; remainingCodes: string[] } {
    const upperCode = code.toUpperCase();
    const index = backupCodes.indexOf(upperCode);

    if (index === -1) {
      return {
        isValid: false,
        remainingCodes: backupCodes,
      };
    }

    // Remove used code
    const remainingCodes = backupCodes.filter((_, i) => i !== index);

    return {
      isValid: true,
      remainingCodes,
    };
  }
}
