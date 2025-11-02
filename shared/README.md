# @vestify/shared

Shared utilities, middleware, and common modules for Vestify microservices.

## Features

- **Error Handling**: Custom error classes and error handler middleware
- **Authentication Middleware**: Simplified JWT-based authentication with `requireAuth` and `requireRole`
- **JWT Utilities**: Token generation and verification with `JWTPayload`

## Installation

This is a local package used within the Vestify monorepo. Install dependencies:

```bash
pnpm install
```

Build the module:

```bash
pnpm build
```

## Usage

### JWTPayload

All JWT tokens use the `JWTPayload` interface:

```typescript
interface JWTPayload {
  userId: string;
  role: string;
  status: string; // e.g., 'active', 'inactive', 'suspended'
}
```

### JWT Utilities

#### Generate Token

```typescript
import { generateToken, JWTPayload } from '@vestify/shared';

const payload: JWTPayload = {
  userId: user.id.toString(),
  role: user.role,
  status: user.isActive ? 'active' : 'inactive',
};

const token = generateToken(payload);
```

#### Verify Token

```typescript
import { verifyToken } from '@vestify/shared';

const payload = verifyToken(token);
console.log(payload.userId, payload.role, payload.status);
```

### Authentication Middleware

#### requireAuth

Decodes JWT token from Authorization header and attaches `JWTPayload` to `req.user`:

```typescript
import { requireAuth } from '@vestify/shared';

// Basic usage
router.get('/protected', requireAuth(), (req, res) => {
  // req.user contains JWTPayload
  console.log(req.user.userId, req.user.role, req.user.status);
});

// With custom secret
router.get('/protected', requireAuth(process.env.CUSTOM_JWT_SECRET), handler);
```

#### requireRole

Checks if the authenticated user's role exists in the allowed roles. **Must be used after requireAuth**:

```typescript
import { requireAuth, requireRole } from '@vestify/shared';

// Single role
router.get('/admin', requireAuth(), requireRole('admin'), handler);

// Multiple roles
router.get('/moderator', requireAuth(), requireRole('admin', 'moderator'), handler);
```

### Error Handling

```typescript
import express from 'express';
import { errorHandler, notFoundHandler, CustomError } from '@vestify/shared';

const app = express();

// Your routes...

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Throw custom errors in your code
throw new CustomError('Resource not found', 404);
```

## Complete Example

```typescript
import express from 'express';
import 'express-async-errors';
import { requireAuth, requireRole, errorHandler, notFoundHandler, generateToken, JWTPayload } from '@vestify/shared';

const app = express();
app.use(express.json());

// Login endpoint - generate token
app.post('/login', async (req, res) => {
  // ... authenticate user ...
  
  const payload: JWTPayload = {
    userId: user.id.toString(),
    role: user.role,
    status: user.isActive ? 'active' : 'inactive',
  };
  
  const token = generateToken(payload);
  res.json({ token });
});

// Protected route
app.get('/me', requireAuth(), (req, res) => {
  // req.user contains JWTPayload
  res.json({ user: req.user });
});

// Admin-only route
app.get('/admin', requireAuth(), requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(3000);
```

## User-Service Integration

In `user-service`, the middleware is wrapped to fetch full user data from the database:

```typescript
import { requireAuth as sharedRequireAuth } from '@vestify/shared';

export const requireAuth = async (req, res, next) => {
  // Use shared requireAuth to decode token
  await sharedRequireAuth()(req, res, async () => {
    // Fetch full user from database
    const user = await User.findById(req.user.userId);
    req.user = user; // Attach full user object
    next();
  });
};
```

## Notes

- Always use `express-async-errors` to handle async errors automatically
- Error handler must be the last middleware
- 404 handler should be before error handler
- JWT secret defaults to `JWT_SECRET` environment variable
- Token expiration defaults to `JWT_EXPIRES_IN` environment variable or '7d'
- `requireRole` must be used after `requireAuth`

## Build Output

The module builds to the `dist` folder with:
- Compiled JavaScript (`.js`)
- TypeScript declarations (`.d.ts`)
- Source maps (`.js.map`, `.d.ts.map`)
