# Order Service

A microservice for managing orders in the Vestify e-commerce platform. Built with Express, TypeScript, and MongoDB.

## Features

- ✅ Create orders with 15-minute expiration
- ✅ Get order by ID
- ✅ Get user's orders with pagination and filtering
- ✅ Get all orders (Admin) with advanced filtering
- ✅ Update order status (Admin)
- ✅ Cancel orders
- ✅ Delete orders (Admin)
- ✅ Automatic order number generation
- ✅ Order expiration tracking
- ✅ Payment status management
- ✅ Comprehensive error handling
- ✅ TypeScript for type safety
- ✅ Docker support with pnpm
- ✅ Full unit test coverage

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Package Manager**: pnpm
- **Authentication**: JWT (via @vestify/shared)

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MongoDB (local or remote)

## Installation

```bash
# Install dependencies
pnpm install
```

## Configuration

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3003

MONGODB_URI=mongodb://localhost:27017/vestify_orders
MONGODB_DB_NAME=vestify_orders

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

## Development

```bash
# Run in development mode with hot reload
pnpm dev
```

The server will start on `http://localhost:3003`

## Production Build

```bash
# Build TypeScript to JavaScript
pnpm build

# Start production server
pnpm start
```

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Docker

### Development Mode

```bash
# Build and run in development mode
docker build -t order-service:latest --target development .
docker run -p 3003:3003 order-service:latest
```

## API Endpoints

### Public Routes

None (all routes require authentication)

### Protected Routes

- `POST /api/orders` - Create a new order
- `GET /api/orders` - Get current user's orders (with pagination and filtering)
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/cancel` - Cancel an order

### Admin Routes

- `GET /api/orders/admin/all` - Get all orders (with pagination and filtering)
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete an order

## Order Expiration

Each order created has an automatic expiration time of **15 minutes** from creation. The `expiresAt` field is automatically set when an order is created. Use the `isExpired()` method on the order model to check if an order has expired.

## Order Status Flow

```
pending → confirmed → processing → shipped → delivered
   ↓
cancelled
```

## Order Model

The Order model includes:
- Order items (products with variants)
- Shipping address
- Pricing (subtotal, shipping, tax, discount, total)
- Status tracking (order status and payment status)
- Expiration time (15 minutes)
- Order number (auto-generated)

## Project Structure

```
order-service/
├── src/
│   ├── __tests__/          # Unit tests
│   │   ├── controllers/   # Controller tests
│   │   ├── routes/         # Route tests
│   │   └── helpers/        # Test helpers
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/        # Middleware (validators)
│   ├── models/             # Mongoose models
│   ├── routes/              # Express routes
│   ├── utils/               # Utility functions
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── package.json
├── tsconfig.json
├── jest.config.js
└── Dockerfile
```

## Responsibilities

The Order Service is responsible for:
- Cart management and checkout
- Order creation and tracking
- Order status management
- Order expiration handling
- Payment status tracking
- Order history for users
- Admin order management

## License

MIT

