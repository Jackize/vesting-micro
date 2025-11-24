# Product Service

A microservice for managing products in the Vestify e-commerce platform. Built with Express, TypeScript, and MongoDB.

## Features

- ✅ Full CRUD operations for products
- ✅ Product variants management (size, color, etc.)
- ✅ Stock management (per variant and total)
- ✅ Product categories and tags
- ✅ Search and filtering capabilities
- ✅ Product images and video support
- ✅ SEO-friendly URLs (slugs)
- ✅ Featured products
- ✅ Pagination and sorting
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
PORT=3002

MONGODB_URI=mongodb://localhost:27017/vestify_products
MONGODB_DB_NAME=vestify_products

CORS_ORIGIN=http://localhost:3000
```

## Development

```bash
# Run in development mode with hot reload
pnpm dev
```

The server will start on `http://localhost:3002`

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
docker build -t product-service:latest --target development .
docker run -p 3002:3002 product-service:latest
```

## API Endpoints

### Public Routes

- `GET /api/products` - Get all products (with pagination, filtering, sorting)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/featured` - Get featured products

### Protected Routes (Admin Only)

- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/stock` - Update product stock

### Health Check

- `GET /health` - Service health check
- `GET /` - API information

## Query Parameters

### GET /api/products

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `?page=2` |
| `limit` | number | Items per page (default: 12) | `?limit=20` |
| `status` | string | Filter by status (`active`, `draft`, `archived`, `out_of_stock`) | `?status=active` |
| `category` | string | Filter by category | `?category=men-vests` |
| `featured` | boolean | Filter featured products | `?featured=true` |
| `tags` | string/array | Filter by tags | `?tags=summer&tags=sale` |
| `search` | string | Text search | `?search=vest` |
| `minPrice` | number | Minimum price filter | `?minPrice=50` |
| `maxPrice` | number | Maximum price filter | `?maxPrice=200` |
| `sort` | string | Sort option (`price_asc`, `price_desc`, `name_asc`, `name_desc`, `rating`, `newest`, `oldest`) | `?sort=price_asc` |

## Example Requests

### Get All Products

```bash
curl http://localhost:3002/api/products
```

### Get Products with Filters

```bash
curl "http://localhost:3002/api/products?category=men-vests&status=active&sort=price_asc&page=1&limit=12"
```

### Search Products

```bash
curl "http://localhost:3002/api/products/search?q=leather+vest"
```

### Get Product by Slug

```bash
curl http://localhost:3002/api/products/slug/mens-leather-vest-black
```

### Create Product (Admin)

```bash
curl -X POST http://localhost:3002/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Mens Leather Vest Black",
    "slug": "mens-leather-vest-black",
    "description": "Premium leather vest for men",
    "shortDescription": "Stylish black leather vest",
    "sku": "LVEST-BLK-001",
    "category": "men-vests",
    "images": ["https://example.com/vest1.jpg"],
    "basePrice": 129.99,
    "compareAtPrice": 179.99,
    "stock": 50,
    "status": "active",
    "featured": true,
    "tags": ["leather", "men", "black"],
    "variants": [
      {
        "name": "Size",
        "value": "Small",
        "sku": "LVEST-BLK-001-S",
        "stock": 15,
        "price": 129.99
      },
      {
        "name": "Size",
        "value": "Medium",
        "sku": "LVEST-BLK-001-M",
        "stock": 20,
        "price": 129.99
      },
      {
        "name": "Size",
        "value": "Large",
        "sku": "LVEST-BLK-001-L",
        "stock": 15,
        "price": 129.99
      }
    ]
  }'
```

### Update Product Stock (Admin)

```bash
# Update total stock
curl -X PATCH http://localhost:3002/api/products/PRODUCT_ID/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "stock": 100
  }'

# Update variant stock
curl -X PATCH http://localhost:3002/api/products/PRODUCT_ID/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "variantIndex": 0,
    "quantity": -5
  }'
```

## Product Model

```typescript
{
  name: string;
  slug: string (unique);
  description: string;
  shortDescription?: string;
  sku: string (unique);
  category: string;
  tags?: string[];
  images: string[];
  videoUrl?: string;
  variants: IVariant[];
  basePrice: number;
  compareAtPrice?: number;
  stock: number;
  status: "draft" | "active" | "archived" | "out_of_stock";
  featured: boolean;
  rating?: number (0-5);
  reviewCount?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Variant Model

```typescript
{
  name: string; // e.g., "Size", "Color"
  value: string; // e.g., "Small", "Red"
  sku?: string;
  price?: number;
  stock: number;
  image?: string;
}
```

## Error Handling

The service includes comprehensive error handling:

- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (product/resource not found)
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
product-service/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── controllers/
│   │   └── productController.ts # Product route handlers
│   ├── middleware/
│   │   └── validator.ts         # Request validation
│   ├── models/
│   │   └── Product.ts           # Product Mongoose model
│   ├── routes/
│   │   └── productRoutes.ts     # Product routes
│   ├── app.ts                   # Express app configuration
│   └── server.ts                # Server entry point
├── dist/                         # Compiled JavaScript (build output)
├── Dockerfile                    # Docker configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- Helmet.js for security headers
- CORS configuration
- Input validation with express-validator
- Role-based access control (RBAC) for admin routes
- JWT authentication via @vestify/shared middleware

## Features in Detail

### Product Variants

Products can have multiple variants (e.g., size, color). Each variant:
- Has its own stock quantity
- Can have variant-specific pricing
- Can have variant-specific images
- Can have its own SKU

The total stock is automatically calculated from all variants.

### Stock Management

- Stock can be updated at the product level (total stock)
- Stock can be updated per variant
- Stock updates automatically set status to `out_of_stock` when stock reaches 0
- Negative stock updates are prevented

### Search and Filtering

- Full-text search using MongoDB text indexes
- Filter by category, status, featured, tags
- Price range filtering
- Multiple sorting options
- Pagination support

### Product Status

- `draft`: Product is not yet published
- `active`: Product is available for purchase
- `archived`: Product is no longer available but kept for records
- `out_of_stock`: Product is active but has no stock

## Testing

The project uses Jest and Supertest for testing.

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## License

MIT

