import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { getServiceByRoute, ServiceConfig } from "../config/services";

/**
 * Create proxy middleware for a specific service
 */
export const createServiceProxy = (serviceConfig: ServiceConfig) => {
  const proxyOptions: Options = {
    target: serviceConfig.url,
    changeOrigin: true,
    timeout: serviceConfig.timeout || 10000,
    pathRewrite: {
      // Keep the path as is, services handle their own routing
      "^/api": "/",
    },
    onError: (err: Error, req: Request, res: Response) => {
      console.error(`Proxy error for ${serviceConfig.name}:`, err);
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: `Service ${serviceConfig.name} is temporarily unavailable`,
          code: "SERVICE_UNAVAILABLE",
        });
      }
    },
    onProxyReq: (proxyReq, req: Request) => {
      if (req.body && typeof req.body === "object") {
        const bodyData = JSON.stringify(req.body);

        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));

        proxyReq.write(bodyData);
      }
      // Forward original headers
      if (req.headers["x-forwarded-for"]) {
        proxyReq.setHeader("x-forwarded-for", req.headers["x-forwarded-for"]);
      }
      if (req.headers["x-real-ip"]) {
        proxyReq.setHeader("x-real-ip", req.headers["x-real-ip"]);
      }

      // Forward user info if authenticated
      if ((req as any).currentUser) {
        proxyReq.setHeader("x-user-id", (req as any).currentUser.id);
        proxyReq.setHeader("x-user-email", (req as any).currentUser.email);
      }
    },
    onProxyRes: (proxyRes, req: Request) => {
      // Log response status
      if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
        console.warn(
          `Service ${serviceConfig.name} returned ${proxyRes.statusCode} for ${req.method} ${req.path}`,
        );
      }
    },
  };

  return createProxyMiddleware(proxyOptions);
};

const proxyCache = new Map<string, any>();
/**
 * Dynamic proxy middleware that routes to appropriate service
 */
export const serviceProxy = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const serviceConfig = getServiceByRoute(req.path);
  if (!serviceConfig) {
    return next(
      new CustomError(`No service found for route: ${req.path}`, 404),
    );
  }
  if (!proxyCache.has(serviceConfig.name)) {
    proxyCache.set(serviceConfig.name, createServiceProxy(serviceConfig));
  }
  // Create proxy middleware for this request
  return proxyCache.get(serviceConfig.name)(req, res, () => next());
};
