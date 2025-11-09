import { ProductStatus } from "@vestify/shared";
import mongoose, { Document, Model, Schema } from "mongoose";

// Variant schema for product variations (size, color, etc.)
export interface IProductVariant {
  name: string; // e.g., "Size", "Color"
  value: string; // e.g., "Small", "Red"
  sku?: string; // Stock Keeping Unit
  price?: number; // Variant-specific price (optional)
  stock: number; // Stock quantity for this variant
  image?: string; // Variant-specific image
}

// Simplified Product interface for order-service
// This is a local copy of product data for quick order validation
export interface IProduct extends Document {
  productId: string; // ID from product-service (original _id)
  name: string;
  slug: string;
  sku: string;
  status: ProductStatus;
  basePrice: number;
  stock: number;
  variants: IProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    image: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const ProductSchema: Schema = new Schema<IProduct>(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      required: true,
      default: ProductStatus.DRAFT,
      index: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    variants: {
      type: [ProductVariantSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "products",
  },
);

// Indexes for performance
ProductSchema.index({ productId: 1 }, { unique: true });
ProductSchema.index({ status: 1 });
ProductSchema.index({ slug: 1 });

// Transform output when converting to JSON
ProductSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export interface IProductModel extends Model<IProduct> {
  findByProductId(productId: string): Promise<IProduct | null>;
  findBySlug(slug: string): Promise<IProduct | null>;
}

// Static method to find product by productId (from product-service)
ProductSchema.statics.findByProductId = async function (
  productId: string,
): Promise<IProduct | null> {
  return this.findOne({ productId });
};

// Static method to find product by slug
ProductSchema.statics.findBySlug = async function (
  slug: string,
): Promise<IProduct | null> {
  return this.findOne({ slug: slug.toLowerCase() });
};

const Product: IProductModel = mongoose.model<IProduct, IProductModel>(
  "Product",
  ProductSchema,
);

export default Product;
