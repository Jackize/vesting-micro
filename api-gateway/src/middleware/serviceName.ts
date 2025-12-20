import { NextFunction, Request, Response } from "express";
import { getServiceByRoute } from "../config/services";

/**
 * Middleware to attach service name to request
 */
export const attachServiceName = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Strip /api prefix for route matching (routes are stored without /api)
  const path = req.path.startsWith("/api") ? req.path.slice(4) : req.path;
  // console.log("path", path);
  const serviceConfig = getServiceByRoute(path);
  // console.log("serviceConfig", serviceConfig);
  if (serviceConfig) {
    (req as any).serviceName = serviceConfig.name;
  }
  next();
};
