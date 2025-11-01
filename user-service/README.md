# User Service

A microservice for managing users in the Vestify e-commerce platform. Built with Express, TypeScript, and MongoDB.

## Features

- ✅ User registration and authentication
- ✅ JWT-based authentication
- ✅ User profile management
- ✅ Role-based access control (RBAC)
- ✅ MongoDB integration with Mongoose
- ✅ Comprehensive error handling
- ✅ TypeScript for type safety
- ✅ Docker support with pnpm
- ✅ Development and production modes

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Package Manager**: pnpm
- **Authentication**: JWT (JSON Web Tokens)

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
PORT=3001

MONGODB_URI=mongodb://localhost:27017/vestify_users
MONGODB_DB_NAME=vestify_users

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=30d

CORS_ORIGIN=http://localhost:3000
```

## Development

```bash
# Run in development mode with hot reload
pnpm dev
```

The server will start on `http://localhost:3001`

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
BUILD_TARGET=development docker-compose up --build

# Or using docker-compose
docker-compose -f docker-compose.yml up --build
```

### Production Mode

```bash
# Build and run in production mode
BUILD_TARGET=production docker-compose up --build
```

## API Endpoints

### Public Routes

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user

### Protected Routes

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/:id` - Get user by ID

### Admin Routes

- `GET /api/users` - Get all users (with pagination)
- `DELETE /api/users/:id` - Delete user (admin only)

### Health Check

- `GET /health` - Service health check
- `GET /` - API information

## Example Requests

### Register User

```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Current User (Protected)

```bash
curl -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## User Model

```typescript
{
  email: string;
  password: string (hashed);
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

The service includes comprehensive error handling:

- 400: Bad Request (validation errors, duplicate entries)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions, deactivated account)
- 404: Not Found (user/resource not found)
- 500: Internal Server Error

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "stack": "Error stack (development only)"
}
```

## Project Structure

```
user-service/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── controllers/
│   │   └── userController.ts    # User route handlers
│   ├── middleware/
│   │   ├── auth.ts              # Authentication & authorization
│   │   └── errorHandler.ts      # Error handling middleware
│   ├── models/
│   │   └── User.ts              # User Mongoose model
│   ├── routes/
│   │   └── userRoutes.ts        # User routes
│   └── server.ts                # Express app & server
├── dist/                         # Compiled JavaScript (build output)
├── Dockerfile                    # Docker configuration
├── docker-compose.yml           # Docker Compose configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Helmet.js for security headers
- CORS configuration
- Input validation
- Role-based access control (RBAC)

## Testing

The project uses Jest and Supertest for testing.

### Setup

No setup required! Tests automatically use mock environment variables and `mongodb-memory-server` for an in-memory MongoDB instance.

**Note:** 
- Tests use `mongodb-memory-server` which creates an in-memory MongoDB instance
- No external MongoDB server is required for testing
- Test environment variables are set automatically in the test setup

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

- `src/__tests__/setup.ts` - Test setup and database connection
- `src/__tests__/helpers/testHelpers.ts` - Test utility functions
- `src/__tests__/routes/` - Route test files
  - `appRoutes.test.ts` - Health check and root endpoint tests
  - `userRoutes.test.ts` - All user route tests

### Test Coverage

Tests cover:
- ✅ User registration (success, validation, duplicates)
- ✅ User login (success, invalid credentials, inactive users)
- ✅ Protected routes (authentication, authorization)
- ✅ User profile management (get, update)
- ✅ Admin routes (get all users, delete users)
- ✅ Pagination and filtering
- ✅ Error handling (404, 401, 403, 400)

## License

MIT

