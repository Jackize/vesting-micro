import { Request } from "express";

export interface DeviceInfo {
  userAgent?: string;
  ip?: string;
  deviceType?: string;
}

/**
 * Extract device information from request
 */
export function getDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers["user-agent"] || undefined;
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    undefined;

  // Simple device type detection
  let deviceType: string | undefined;
  if (userAgent) {
    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
      deviceType = "mobile";
    } else if (/tablet/i.test(userAgent)) {
      deviceType = "tablet";
    } else {
      deviceType = "desktop";
    }
  }

  return {
    userAgent,
    ip,
    deviceType,
  };
}
