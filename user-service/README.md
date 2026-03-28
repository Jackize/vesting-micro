# User Service

Authentication and user management microservice for the Vestify e-commerce platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT access tokens (15 min) + opaque refresh tokens stored in MongoDB (7 days)
- **Package Manager**: pnpm

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MongoDB

## Setup

```bash
pnpm install
```

Create a `.env` file:

```env
NODE_ENV=development
PORT=3001

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=vestify_users

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Default admin seeded on first startup (optional)
DEFAULT_ADMIN_EMAIL=admin@vestify.com
DEFAULT_ADMIN_PASSWORD=Admin123!
DEFAULT_ADMIN_FIRST_NAME=Admin
DEFAULT_ADMIN_LAST_NAME=User
```

## Commands

```bash
pnpm dev            # dev server with hot reload
pnpm build          # compile TypeScript → dist/
pnpm start          # run compiled build
pnpm test           # run tests (in-memory MongoDB, no external deps)
pnpm test:watch     # watch mode
pnpm test:coverage  # with coverage report
pnpm lint           # ESLint
pnpm format         # Prettier
```

## API Documentation

Swagger UI is available at **`/api/docs`** when the server is running.
Raw OpenAPI JSON is at **`/api/docs.json`** — import this URL directly into Postman.

## Endpoints

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/register` | — | Create account, sends verification email |
| POST | `/api/users/login` | — | Returns `accessToken` + `refreshToken` |
| POST | `/api/users/refresh` | — | Exchange refresh token for new access token |
| POST | `/api/users/logout` | Bearer | Delete refresh token (body: `{ refreshToken }`) |

### Email Verification

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/verify-email?token=` | — | Activate account via emailed token |
| POST | `/api/users/resend-verification` | — | Resend verification email (5-min cooldown) |

### Password

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/forgot-password` | — | Send reset link (always returns 200) |
| GET | `/api/users/reset-password?token=` | — | Validate reset token before showing form |
| POST | `/api/users/reset-password` | — | Set new password, invalidates all sessions |
| PUT | `/api/users/change-password` | Bearer | Change password while logged in |

### Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | Bearer | Get current user profile |
| PUT | `/api/users/me` | Bearer | Update `firstName`, `lastName`, `phone`, `avatar` |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | Bearer (admin/moderator) | List users — supports `?page`, `?limit`, `?role`, `?isActive` |
| GET | `/api/users/:id` | Bearer | Get user by ID |
| DELETE | `/api/users/:id` | Bearer (admin) | Delete user |
| PUT | `/api/users/:id/role` | Bearer (admin) | Change user role |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service liveness |
| GET | `/api/users/health` | Route-level health |

## Auth Flow

```
1. POST /register  →  account created (inactive), verification email sent
2. GET  /verify-email?token=  →  account activated
3. POST /login  →  { accessToken, refreshToken }
4. Use accessToken in:  Authorization: Bearer <token>
5. POST /refresh  →  new accessToken when old one expires
6. POST /logout  →  refresh token deleted from DB
```

## Response Format

All responses follow a consistent envelope:

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "error": "..." }

// Validation error
{ "success": false, "errors": [{ "field": "email", "message": "..." }] }
```

## User Model

```typescript
{
  email: string           // unique, lowercase
  password: string        // bcrypt-hashed, never returned in responses
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: 'user' | 'admin' | 'moderator'
  isEmailVerified: boolean
  isActive: boolean       // set to true on email verification
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}
```

## Default Admin

On first startup, if no admin user exists in the database, one is created using `DEFAULT_ADMIN_*` env vars (defaults to `admin@vestify.com` / `Admin123!`). Change the password immediately after first login in production.

## Project Structure

```
src/
├── config/
│   ├── database.ts          # MongoDB connection singleton
│   └── swagger.ts           # OpenAPI 3.0 spec
├── controllers/
│   ├── registerController.ts
│   ├── loginController.ts
│   ├── logoutController.ts
│   ├── refreshController.ts
│   ├── emailVerificationController.ts
│   ├── passwordResetController.ts
│   ├── changePasswordController.ts
│   ├── profileController.ts
│   ├── userController.ts
│   └── updateUserRole.ts
├── middleware/
│   ├── auth.ts              # Re-exports currentUser from @vestify/shared
│   └── validator.ts         # express-validator chains
├── models/
│   ├── User.ts
│   ├── RefreshToken.ts
│   ├── EmailVerificationToken.ts
│   ├── PasswordResetToken.ts
│   └── plugin/findByIdOrThrow.plugin.ts
├── routes/
│   └── userRoutes.ts
├── scripts/
│   └── seedDefaultAdmin.ts
├── services/
│   └── emailService.ts      # Email templates (logs to console; TODO: publish to jobs-service)
├── utils/
│   └── jwt.ts
├── app.ts
└── server.ts
```
