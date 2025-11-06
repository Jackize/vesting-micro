import jwt from "jsonwebtoken";

/**
 * Generate JWT Token for user authentication
 * @param userId - User ID to encode in the token
 * @param role - User role to encode in the token
 * @param status - User status to encode in the token
 * @returns JWT token string
 */
export const generateToken = (
  userId: string,
  role: string,
  status: boolean,
): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;
  return jwt.sign({ userId, role, status }, secret!, {
    expiresIn,
  } as jwt.SignOptions);
};
