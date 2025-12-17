import { NextFunction, Request, RequestHandler, Response } from "express";
import morgan from "morgan";

/**
 * Custom morgan token for request ID
 */
morgan.token("request-id", (req: Request) => {
  return (req as any).id || "-";
});

/**
 * Custom morgan token for user ID
 */
morgan.token("user-id", (req: Request) => {
  return (req as any).currentUser?.id || "-";
});

/**
 * Custom morgan token for service name
 */
morgan.token("service", (req: Request) => {
  return (req as any).serviceName || "-";
});

/**
 * Request logger middleware
 */
export const requestLogger: RequestHandler = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms - RequestID: :request-id - UserID: :user-id - Service: :service',
  {
    skip: (req: Request) => {
      // Skip health check logs
      return req.path === "/health";
    },
  },
);

/**
 * Generate request ID middleware
 */
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  (req as any).id =
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader("X-Request-ID", (req as any).id);
  next();
};
