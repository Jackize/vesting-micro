# Vestify Scripts

This directory contains utility scripts for the Vestify platform.

## Seed Products

Seeds the product database by calling the product-service API.

### Prerequisites

1. Product service must be running
2. You need a valid admin JWT token
3. Install dependencies: `pnpm install` (or `npm install`)

### Usage

```bash
# Set environment variables
export API_URL=http://localhost:3001  # or https://vestify.com
export ADMIN_TOKEN=your-admin-jwt-token

# Run the script
pnpm run seed:products
# or
ts-node seed-products.ts
```

### Environment Variables

- `API_URL` (optional): The base URL of the product-service API. Defaults to `http://localhost:3001`
- `ADMIN_TOKEN` (required): JWT token for admin authentication

### Example

```bash
export API_URL=http://localhost:3001
export ADMIN_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
pnpm run seed:products
```

The script will:
1. Create all products via the API
2. The API will automatically publish `ProductCreated` events
3. The order-service will receive these events and sync the product data

