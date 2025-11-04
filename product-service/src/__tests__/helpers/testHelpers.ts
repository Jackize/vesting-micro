import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Product, { IProduct, IVariant } from "../../models/Product";

// Helper to generate JWT token for testing
export const generateTestToken = (
  userId: string,
  role: string = "user",
  isActive: boolean = true,
): string => {
  const secret =
    process.env.JWT_SECRET || "test-super-secret-jwt-key-for-testing";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign({ userId, role, status: isActive }, secret, {
    expiresIn,
  } as jwt.SignOptions);
};

export const getAdminToken = (): string => {
  const userId = new mongoose.Types.ObjectId().toString();
  return generateTestToken(userId, "admin", true);
};

export const getUserToken = (userId?: string): string => {
  const id = userId || new mongoose.Types.ObjectId().toString();
  return generateTestToken(id, "user", true);
};

// Helper to create test product
export const createTestProduct = async (productData?: {
  name?: string;
  slug?: string;
  description?: string;
  sku?: string;
  category?: string;
  basePrice?: number;
  stock?: number;
  status?: "draft" | "active" | "archived" | "out_of_stock";
  featured?: boolean;
  images?: string[];
  variants?: IVariant[];
  tags?: string[];
}): Promise<IProduct> => {
  const defaultProduct = {
    name: `Test Product ${Math.random().toString(36).substring(7)}`,
    slug: `test-product-${Math.random().toString(36).substring(7)}`,
    description: "Test product description",
    shortDescription: "Short test description",
    sku: `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`,
    category: "test-category",
    images: ["https://example.com/product.jpg"],
    basePrice: 99.99,
    compareAtPrice: 149.99,
    stock: 100,
    status: "active" as const,
    featured: false,
    tags: ["test"],
    ...productData,
  };

  const product = await Product.create(defaultProduct);
  return product;
};

// Helper to create product with variants
export const createProductWithVariants = async (): Promise<IProduct> => {
  return createTestProduct({
    name: "Product with Variants",
    slug: "product-with-variants",
    variants: [
      {
        name: "Size",
        value: "Small",
        sku: "PROD-S",
        stock: 10,
        price: 99.99,
      },
      {
        name: "Size",
        value: "Medium",
        sku: "PROD-M",
        stock: 20,
        price: 99.99,
      },
      {
        name: "Size",
        value: "Large",
        sku: "PROD-L",
        stock: 15,
        price: 109.99,
      },
    ],
  });
};

// Helper to create featured product
export const createFeaturedProduct = async (): Promise<IProduct> => {
  return createTestProduct({
    name: "Featured Product",
    slug: `featured-product-${Math.random().toString(36).substring(7)}`,
    featured: true,
    status: "active",
  });
};

// Helper to create products in different categories
export const createProductsByCategory = async (
  category: string,
  count: number = 3,
): Promise<IProduct[]> => {
  const products = [];
  for (let i = 0; i < count; i++) {
    products.push(
      await createTestProduct({
        name: `Product ${i + 1} in ${category}`,
        slug: `${category}-product-${i + 1}`,
        category,
        status: "active",
      }),
    );
  }
  return products;
};

export const validObjectId = (): string => {
  return new mongoose.Types.ObjectId().toString();
};

export const invalidObjectId = (): string => {
  return "invalid-id";
};
