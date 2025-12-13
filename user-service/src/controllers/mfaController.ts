import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import User from "../models/User";
import { MfaService } from "../services/mfaService";

/**
 * @desc    Start MFA setup (generate secret and QR code)
 * @route   POST /api/users/mfa/setup
 * @access  Private
 */
export const setupMfa = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.currentUser!.userId;

    const user = await User.findById(userId);

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    if (user.mfaEnabled) {
      throw new CustomError("MFA is already enabled", 400);
    }

    // Generate secret
    const secret = MfaService.generateSecret();

    // Generate QR code
    const qrCode = await MfaService.generateQRCode(
      secret,
      user.email,
      process.env.APP_NAME || "Vestify",
    );

    // Temporarily store secret (user needs to verify before enabling)
    // In production, you might want to store this temporarily in Redis
    user.mfaSecret = secret;
    await user.save();

    res.json({
      success: true,
      data: {
        secret,
        qrCode,
        manualEntryKey: secret, // For manual entry if QR code doesn't work
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify and enable MFA
 * @route   POST /api/users/mfa/verify-enable
 * @access  Private
 */
export const verifyAndEnableMfa = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.body;
    const userId = req.currentUser!.userId;

    if (!token) {
      throw new CustomError("MFA token is required", 400);
    }

    const user = await User.findById(userId).select("+mfaSecret");

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    if (!user.mfaSecret) {
      throw new CustomError(
        "MFA setup not started. Please call /mfa/setup first",
        400,
      );
    }

    if (user.mfaEnabled) {
      throw new CustomError("MFA is already enabled", 400);
    }

    // Verify token
    const isValid = MfaService.verifyToken(token, user.mfaSecret);

    if (!isValid) {
      throw new CustomError("Invalid MFA token", 400);
    }

    // Generate backup codes
    const backupCodes = MfaService.generateBackupCodes(10);

    // Enable MFA
    user.mfaEnabled = true;
    user.mfaBackupCodes = backupCodes;
    await user.save();

    res.json({
      success: true,
      message: "MFA enabled successfully",
      data: {
        backupCodes, // Show backup codes only once
        warning:
          "Save these backup codes in a safe place. They won't be shown again.",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Disable MFA
 * @route   POST /api/users/mfa/disable
 * @access  Private
 */
export const disableMfa = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { password } = req.body;
    const userId = req.currentUser!.userId;

    if (!password) {
      throw new CustomError("Password is required to disable MFA", 400);
    }

    const user = await User.findById(userId).select(
      "+password +mfaSecret +mfaBackupCodes",
    );

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    if (!user.mfaEnabled) {
      throw new CustomError("MFA is not enabled", 400);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new CustomError("Invalid password", 401);
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.mfaBackupCodes = undefined;
    await user.save();

    res.json({
      success: true,
      message: "MFA disabled successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Regenerate backup codes
 * @route   POST /api/users/mfa/regenerate-backup-codes
 * @access  Private
 */
export const regenerateBackupCodes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { password } = req.body;
    const userId = req.currentUser!.userId;

    if (!password) {
      throw new CustomError("Password is required", 400);
    }

    const user = await User.findById(userId).select(
      "+password +mfaBackupCodes",
    );

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    if (!user.mfaEnabled) {
      throw new CustomError("MFA is not enabled", 400);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new CustomError("Invalid password", 401);
    }

    // Generate new backup codes
    const backupCodes = MfaService.generateBackupCodes(10);
    user.mfaBackupCodes = backupCodes;
    await user.save();

    res.json({
      success: true,
      message: "Backup codes regenerated successfully",
      data: {
        backupCodes,
        warning:
          "Save these backup codes in a safe place. They won't be shown again.",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify MFA token during login
 * @route   POST /api/users/mfa/verify
 * @access  Public (used during login flow)
 */
export const verifyMfaToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      throw new CustomError("User ID and MFA token are required", 400);
    }

    const user = await User.findById(userId).select(
      "+mfaSecret +mfaBackupCodes",
    );

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    if (!user.mfaEnabled) {
      throw new CustomError("MFA is not enabled for this user", 400);
    }

    if (!user.mfaSecret) {
      throw new CustomError("MFA secret not found", 500);
    }

    // Try TOTP token first
    let isValid = MfaService.verifyToken(token, user.mfaSecret);

    // If TOTP fails, try backup codes
    if (!isValid && user.mfaBackupCodes && user.mfaBackupCodes.length > 0) {
      const backupResult = MfaService.verifyAndRemoveBackupCode(
        token,
        user.mfaBackupCodes,
      );

      if (backupResult.isValid) {
        isValid = true;
        user.mfaBackupCodes = backupResult.remainingCodes;
        await user.save();
      }
    }

    if (!isValid) {
      throw new CustomError("Invalid MFA token", 400);
    }

    res.json({
      success: true,
      message: "MFA token verified successfully",
    });
  } catch (error) {
    next(error);
  }
};
