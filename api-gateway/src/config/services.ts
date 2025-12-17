import express from "express";
/**
 * Service configuration for API Gateway
 * Maps route prefixes to microservice URLs
 */

export interface ServiceConfig {
  name: string;
  url: string;
  healthCheck?: string;
  timeout?: number;
}

export const services: Record<string, ServiceConfig> = {
  users: {
    name: "user-service",
    url: process.env.USER_SERVICE_URL || "http://localhost:3001",
    healthCheck: "/health",
    timeout: 10000,
  },
  products: {
    name: "product-service",
    url: process.env.PRODUCT_SERVICE_URL || "http://localhost:3002",
    healthCheck: "/health",
    timeout: 10000,
  },
  orders: {
    name: "order-service",
    url: process.env.ORDER_SERVICE_URL || "http://localhost:3003",
    healthCheck: "/health",
    timeout: 10000,
  },
  payments: {
    name: "payment-service",
    url: process.env.PAYMENT_SERVICE_URL || "http://localhost:3004",
    healthCheck: "/health",
    timeout: 15000, // Payments may take longer
  },
};

/**
 * Route to service mapping
 */
export const routeToService: Record<string, string> = {
  "/api/users": "users",
  "/api/products": "products",
  "/api/orders": "orders",
  "/api/payments": "payments",
};

/**
 * Get service config by route path
 */
export const getServiceByRoute = (path: string): ServiceConfig | null => {
  // Find matching route prefix
  for (const [routePrefix, serviceKey] of Object.entries(routeToService)) {
    if (path.startsWith(routePrefix)) {
      return services[serviceKey] || null;
    }
  }
  return null;
};

export const servicesHealthHandler = async (
  req: express.Request,
  res: express.Response,
) => {
  const healthChecks = await Promise.allSettled(
    Object.values(services).map(async (service) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${service.url}${service.healthCheck}`, {
          signal: controller.signal,
          headers: { "X-Request-ID": (req as any).id },
        });

        clearTimeout(timeoutId);

        return {
          name: service.name,
          status: response.ok ? "healthy" : "unhealthy",
          statusCode: response.status,
        };
      } catch (error) {
        return {
          name: service.name,
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
  );

  const results = healthChecks.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { name: "unknown", status: "error" },
  );

  const allHealthy = results.every((r) => r.status === "healthy");

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    gateway: "healthy",
    services: results,
    timestamp: new Date().toISOString(),
  });
};
