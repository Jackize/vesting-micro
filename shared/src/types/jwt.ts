/**
 * JWT Payload interface
 * Contains user information encoded in the JWT token
 */
export interface JWTPayload {
  userId: string;
  role: string;
  status: boolean;
}
