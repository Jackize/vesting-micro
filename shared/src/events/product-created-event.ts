import { ProductStatus } from "../types/product-status";
import { Subjects } from "./subjects";

export interface IProductVariant {
  name: string; // e.g., "Size", "Color"
  value: string; // e.g., "Small", "Red"
  sku?: string; // Stock Keeping Unit
  price?: number; // Variant-specific price (optional)
  stock: number; // Stock quantity for this variant
  image?: string; // Variant-specific image
}

export interface ProductCreatedEvent {
  queueName: Subjects.ProductCreated;
  data: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    status: ProductStatus;
    basePrice: number;
    stock: number;
    variants: IProductVariant[];
    createdAt: Date;
    updatedAt: Date;
  };
}
