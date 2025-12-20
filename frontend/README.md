# Vestify Frontend

Next.js 15 frontend application for the Vestify e-commerce platform.

## Features

- ✅ Next.js 15 with App Router
- ✅ TypeScript for type safety
- ✅ TailwindCSS for styling
- ✅ React Query (TanStack Query) for data fetching
- ✅ React Hook Form + Zod for form validation
- ✅ Zustand for client state management
- ✅ Authentication integration with user-service
- ✅ Testing with Jest and React Testing Library
- ✅ ESLint and Prettier for code quality

## Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Data Fetching**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **State Management**: Zustand
- **Testing**: Jest + React Testing Library

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Installation

```bash
# Install dependencies
pnpm install
```

## Configuration

Create a `.env.local` file:

```env
# API Gateway URL - single entry point for all microservices
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Note**: The frontend now connects to the API Gateway (port 3000) instead of individual microservices. The gateway handles routing to the appropriate service.

## Development

```bash
# Run development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## Production Build

```bash
# Build for production
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

## Code Quality

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type check
pnpm type-check
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   ├── profile/            # User profile page
│   │   ├── __tests__/          # Page tests
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── providers.tsx       # React Query provider
│   ├── components/
│   │   └── ui/                 # Reusable UI components
│   ├── lib/
│   │   ├── api/                # API client and endpoints
│   │   ├── react-query/        # React Query hooks
│   │   ├── store/              # Zustand stores
│   │   ├── validations/        # Zod schemas
│   │   └── utils.ts            # Utility functions
│   └── types/                  # TypeScript types
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── jest.config.js              # Jest configuration
└── tailwind.config.ts          # TailwindCSS configuration
```

## API Integration

The frontend integrates with all microservices through the **API Gateway**:

- **Base URL**: Configured via `NEXT_PUBLIC_API_URL` (default: `http://localhost:3000`)
- **API Gateway**: Single entry point that routes requests to appropriate microservices
  - `/api/users/*` → User Service
  - `/api/products/*` → Product Service
  - `/api/orders/*` → Order Service
  - `/api/payments/*` → Payment Service
- **Authentication**: JWT tokens stored in cookies, automatically added to requests
- **Data Fetching**: React Query for server state management
- **Error Handling**: Centralized error handling with support for:
  - Rate limiting (429)
  - Unauthorized (401)
  - Service unavailable (503)
  - Request ID tracking for debugging

## Pages

- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/profile` - User profile (protected)

## License

MIT
