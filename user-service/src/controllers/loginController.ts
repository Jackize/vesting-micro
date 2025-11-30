import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import RefreshToken from "../models/RefreshToken";
import User from "../models/User";
import { MfaService } from "../services/mfaService";
import { SecurityService } from "../services/securityService";
import { getDeviceInfo } from "../utils/deviceInfo";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  // Find user and include password field
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user) {
    throw new CustomError("Invalid email or password", 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new CustomError("Account has been deactivated", 403);
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    const minutesLeft = user.getLockoutDuration();
    throw new CustomError(
      `Account is temporarily locked. Please try again in ${minutesLeft} second(s).`,
      423,
    );
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    // Increment failed login attempts and apply lockout if needed
    await user.incrementFailedLoginAttempts();

    // Check if account got locked after this attempt
    if (user.isAccountLocked()) {
      const secondsLeft = user.getLockoutDuration();
      throw new CustomError(
        `Too many failed login attempts. Account locked for ${secondsLeft} second(s).`,
        423,
      );
    }

    throw new CustomError("Invalid email or password", 401);
  }

  // Reset failed login attempts on successful login
  await user.resetFailedLoginAttempts();

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const userId = (user._id as mongoose.Types.ObjectId).toString();

  // Check for suspicious login activity
  const deviceInfo = getDeviceInfo(req);

  const loginContext = {
    userId,
    ip: deviceInfo.ip || "unknown",
    deviceInfo,
    // TODO: Add location detection service (e.g., MaxMind GeoIP2)
    // location: await getLocationFromIP(ip),
  };

  const suspiciousResult =
    await SecurityService.checkSuspiciousLogin(loginContext);

  // Record login in history
  await SecurityService.recordLogin(loginContext, suspiciousResult);

  // Send alert if suspicious
  if (suspiciousResult.isSuspicious) {
    SecurityService.sendSuspiciousLoginAlert(
      userId,
      suspiciousResult.reasons,
      loginContext,
    ).catch((error) => {
      console.error("Error sending suspicious login alert:", error);
      // Don't block login if email fails
    });
  }

  // Check if MFA is enabled
  if (user.mfaEnabled) {
    const { mfaToken } = req.body;

    if (!mfaToken) {
      // Return response indicating MFA is required
      return res.status(200).json({
        success: false,
        requiresMfa: true,
        message: "MFA token required",
        data: {
          userId,
        },
      });
    }

    // Verify MFA token
    const userWithMfa = await User.findById(userId).select(
      "+mfaSecret +mfaBackupCodes",
    );

    if (!userWithMfa || !userWithMfa.mfaSecret) {
      throw new CustomError("MFA configuration error", 500);
    }

    // Try TOTP token first
    let isValidMfa = MfaService.verifyToken(mfaToken, userWithMfa.mfaSecret);

    // If TOTP fails, try backup codes
    if (
      !isValidMfa &&
      userWithMfa.mfaBackupCodes &&
      userWithMfa.mfaBackupCodes.length > 0
    ) {
      const backupResult = MfaService.verifyAndRemoveBackupCode(
        mfaToken,
        userWithMfa.mfaBackupCodes,
      );

      if (backupResult.isValid) {
        isValidMfa = true;
        userWithMfa.mfaBackupCodes = backupResult.remainingCodes;
        await userWithMfa.save();
      }
    }

    if (!isValidMfa) {
      throw new CustomError("Invalid MFA token", 401);
    }
  }

  // Generate access token (short-lived)
  const accessToken = generateAccessToken(userId, user.role, user.isActive);

  // Generate refresh token (long-lived)
  const refreshTokenValue = RefreshToken.generateToken();
  const sessionId = RefreshToken.generateSessionId();
  const refreshTokenJWT = generateRefreshToken(userId);

  // Calculate expiration (7 days default)
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  const expiresInSeconds = expiresIn.endsWith("d")
    ? parseInt(expiresIn) * 24 * 60 * 60
    : expiresIn.endsWith("h")
      ? parseInt(expiresIn) * 60 * 60
      : parseInt(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  // Store refresh token in database
  await RefreshToken.create({
    userId,
    token: refreshTokenValue,
    sessionId,
    expiresAt,
    deviceInfo,
  });

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        role: user.role,
        lastLogin: user.lastLogin,
      },
      accessToken,
      refreshToken: refreshTokenValue, // Return the DB token, not JWT
    },
  });
};
