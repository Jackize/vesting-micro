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
  const serviceConfig = getServiceByRoute(req.path);
  if (serviceConfig) {
    (req as any).serviceName = serviceConfig.name;
  }
  next();
};
