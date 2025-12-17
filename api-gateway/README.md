# API Gateway Service

The API Gateway is the single entry point for all client requests to the Vestify e-commerce platform. It handles routing, authentication, rate limiting, and request logging.

## Features

- ✅ **Service Routing**: Routes requests to appropriate microservices based on URL path
- ✅ **Rate Limiting**: Redis-based rate limiting with different limits for different endpoints
- ✅ **Request Logging**: Comprehensive request/response logging with Morgan
- ✅ **Health Checks**: Gateway health check and service health monitoring
- ✅ **Error Handling**: Centralized error handling and standardized error responses
- ✅ **CORS**: Configurable CORS support
- ✅ **Security**: Helmet.js for HTTP header security

## Architecture

```
Client Request
    ↓
API Gateway (Port 3000)
    ├─ Rate Limiting
    ├─ Request Logging
    └─ Service Proxy
        ├─→ User Service (Port 3001)
        ├─→ Product Service (Port 3002)
        ├─→ Order Service (Port 3003)
        └─→ Payment Service (Port 3004)
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Rate Limiting**: express-rate-limit + Redis
- **Proxy**: http-proxy-middleware
- **Logging**: Morgan
- **Package Manager**: pnpm

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Redis (for rate limiting)
- Running microservices (user-service, product-service, order-service, payment-service)

## Installation

```bash
# Install dependencies
pnpm install
```

## Configuration

Create a `.env` file in the root directory (see `.env.example`):

```env
NODE_ENV=development
PORT=3000

CORS_ORIGIN=http://localhost:3000

REDIS_URL=redis://localhost:6379

USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
```

## Development

```bash
# Run in development mode with hot reload
pnpm dev
```

The gateway will start on `http://localhost:3000`

## Production Build

```bash
# Build TypeScript to JavaScript
pnpm build

# Start production server
pnpm start
```

## Docker

### Development Mode

```bash
# Build and run in development mode
docker build -t api-gateway:latest --target development .
docker run -p 3000:3000 api-gateway:latest
```

### Production Mode

```bash
# Build and run in production mode
docker build -t api-gateway:latest --target production .
docker run -p 3000:3000 api-gateway:latest
```

## API Routes

All routes are prefixed with `/api`:

- `/api/users/*` → Routes to User Service
- `/api/products/*` → Routes to Product Service
- `/api/orders/*` → Routes to Order Service
- `/api/payments/*` → Routes to Payment Service

### Health Check Endpoints

- `GET /health` - Gateway health check
- `GET /health/services` - Check health of all microservices

## Rate Limiting

The gateway implements different rate limits for different endpoint types:

- **General API**: 100 requests per 15 minutes
- **Authentication endpoints** (`/api/users/login`, `/api/users/register`): 5 requests per 15 minutes
- **Payment endpoints** (`/api/payments/*`): 10 requests per minute

Rate limiting uses Redis for distributed rate limiting across multiple gateway instances.

## Request Flow

1. **Request ID Generation**: Each request gets a unique ID for tracking
2. **Request Logging**: Request details are logged
3. **Service Name Attachment**: Service name is attached based on route
4. **Rate Limiting**: Rate limit check based on endpoint type
5. **Authentication**: JWT validation (if required)
6. **Service Proxy**: Request is proxied to appropriate microservice
7. **Response**: Response is returned to client

## Error Handling

The gateway handles errors consistently:

- **404**: Route not found
- **401**: Unauthorized (invalid/missing token)
- **429**: Rate limit exceeded
- **503**: Service unavailable (microservice down)

All errors follow the standard format:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

## Monitoring

The gateway logs all requests with:
- Request ID
- User ID (if authenticated)
- Service name
- Response time
- Status code

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | - |
| `PORT` | Gateway port | `3000` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:3000` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `USER_SERVICE_URL` | User service URL | `http://localhost:3001` |
| `PRODUCT_SERVICE_URL` | Product service URL | `http://localhost:3002` |
| `ORDER_SERVICE_URL` | Order service URL | `http://localhost:3003` |
| `PAYMENT_SERVICE_URL` | Payment service URL | `http://localhost:3004` |

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Linting

```bash
# Check linting
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## Deployment

### Kubernetes

The gateway can be deployed to Kubernetes. See `infra/k8s/` for deployment configurations.

### Docker Compose

Add the gateway to your `docker-compose.yml`:

```yaml
api-gateway:
  build:
    context: ./api-gateway
    target: production
  ports:
    - "3000:3000"
  environment:
    - NODE_ENV=production
    - PORT=3000
    - REDIS_URL=redis://redis:6379
    - USER_SERVICE_URL=http://user-service:3001
    - PRODUCT_SERVICE_URL=http://product-service:3002
    - ORDER_SERVICE_URL=http://order-service:3003
    - PAYMENT_SERVICE_URL=http://payment-service:3004
  depends_on:
    - redis
```

## Security Considerations

- ✅ HTTPS enforced in production (via reverse proxy/load balancer)
- ✅ Helmet.js for HTTP header security
- ✅ Rate limiting to prevent abuse
- ✅ JWT token validation
- ✅ CORS configuration
- ✅ Input validation (delegated to microservices)
- ✅ Request ID tracking for security auditing

## Troubleshooting

### Rate limiting not working

- Ensure Redis is running and accessible
- Check `REDIS_URL` environment variable
- Check Redis connection logs

### Service unavailable errors

- Verify microservices are running
- Check service URLs in `.env`
- Check service health: `GET /health/services`

## License

MIT

