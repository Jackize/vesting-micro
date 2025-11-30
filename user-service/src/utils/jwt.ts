import jwt from "jsonwebtoken";

/**
 * Generate JWT Access Token for user authentication (short-lived)
 * @param userId - User ID to encode in the token
 * @param role - User role to encode in the token
 * @param status - User status to encode in the token
 * @returns JWT access token string
 */
export const generateAccessToken = (
  userId: string,
  role: string,
  status: boolean,
): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "15m"; // Default 15 minutes
  return jwt.sign({ userId, role, status }, secret!, {
    expiresIn,
  } as jwt.SignOptions);
};

/**
 * Generate JWT Refresh Token (long-lived, stored in DB)
 * @param userId - User ID to encode in the token
 * @returns JWT refresh token string
 */
export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d"; // Default 7 days
  return jwt.sign({ userId, type: "refresh" }, secret!, {
    expiresIn,
  } as jwt.SignOptions);
};

/**
 * Verify refresh token
 * @param token - Refresh token to verify
 * @returns Decoded token payload
 */
export const verifyRefreshToken = (token: string): jwt.JwtPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;
  return jwt.verify(token, secret!) as jwt.JwtPayload;
};
