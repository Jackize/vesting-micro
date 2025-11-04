import mongoose, { Document, Model, Schema } from "mongoose";

// Variant schema for product variations (size, color, etc.)
export interface IVariant {
  name: string; // e.g., "Size", "Color"
  value: string; // e.g., "Small", "Red"
  sku?: string; // Stock Keeping Unit
  price?: number; // Variant-specific price (optional)
  stock: number; // Stock quantity for this variant
  image?: string; // Variant-specific image
}

// Product interface
export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  category: string; // Category ID or name
  tags?: string[];
  images: string[]; // Array of image URLs
  videoUrl?: string; // Product video review URL
  variants: IVariant[]; // Product variants (size, color, etc.)
  basePrice: number; // Base price
  compareAtPrice?: number; // Original price (for discounts)
  stock: number; // Total stock (sum of all variants)
  status: "draft" | "active" | "archived" | "out_of_stock";
  featured: boolean; // Featured product
  rating?: number; // Average rating (calculated from reviews)
  reviewCount?: number; // Number of reviews
  weight?: number; // Product weight in kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string[];
  createdBy?: string; // User ID who created the product
  updatedBy?: string; // User ID who last updated
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductModel extends Model<IProduct> {
  findBySlug(slug: string): Promise<IProduct | null>;
  findByCategory(category: string): Promise<IProduct[]>;
  searchProducts(query: string): Promise<IProduct[]>;
  updateStock(
    productId: string,
    variantIndex: number,
    quantity: number,
  ): Promise<IProduct | null>;
}

const VariantSchema = new Schema<IVariant>(
  {
    name: {
      type: String,
      required: [true, "Variant name is required"],
      trim: true,
    },
    value: {
      type: String,
      required: [true, "Variant value is required"],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      sparse: true,
    },
    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
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
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase letters, numbers, and hyphens",
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      required: [true, "At least one image is required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one image is required",
      },
    },
    videoUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Video URL must be a valid URL"],
    },
    variants: {
      type: [VariantSchema],
      default: [],
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare at price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived", "out_of_stock"],
      default: "draft",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: [0, "Review count cannot be negative"],
      default: 0,
    },
    weight: {
      type: Number,
      min: [0, "Weight cannot be negative"],
    },
    dimensions: {
      length: {
        type: Number,
        min: [0, "Length cannot be negative"],
      },
      width: {
        type: Number,
        min: [0, "Width cannot be negative"],
      },
      height: {
        type: Number,
        min: [0, "Height cannot be negative"],
      },
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [60, "SEO title cannot exceed 60 characters"],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
    },
    metaKeywords: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "products",
  },
);

// Indexes for performance
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ name: "text", description: "text", tags: "text" }); // Text search index
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ rating: -1 });

// Pre-save middleware to calculate total stock from variants
ProductSchema.pre("save", function (next) {
  if (this.variants && (this.variants as IVariant[]).length > 0) {
    this.stock = (this.variants as IVariant[]).reduce(
      (total, variant) => total + variant.stock,
      0,
    );
  }

  // Update status based on stock
  if (this.stock === 0 && this.status === "active") {
    this.status = "out_of_stock";
  }

  next();
});

// Static method to find product by slug
ProductSchema.statics.findBySlug = async function (
  slug: string,
): Promise<IProduct | null> {
  return this.findOne({ slug: slug.toLowerCase() });
};

// Static method to find products by category
ProductSchema.statics.findByCategory = async function (
  category: string,
): Promise<IProduct[]> {
  return this.find({ category, status: "active" }).sort({ createdAt: -1 });
};

// Static method to search products
ProductSchema.statics.searchProducts = async function (
  query: string,
): Promise<IProduct[]> {
  return this.find({
    $text: { $search: query },
    status: "active",
  }).sort({ score: { $meta: "textScore" } });
};

// Static method to update stock for a specific variant
ProductSchema.statics.updateStock = async function (
  productId: string,
  variantIndex: number,
  quantity: number,
): Promise<IProduct | null> {
  const product = await this.findById(productId);
  if (!product || !product.variants[variantIndex]) {
    return null;
  }

  product.variants[variantIndex].stock += quantity;
  if (product.variants[variantIndex].stock < 0) {
    product.variants[variantIndex].stock = 0;
  }

  await product.save();
  return product;
};

// Transform output when converting to JSON
ProductSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Product: IProductModel = mongoose.model<IProduct, IProductModel>(
  "Product",
  ProductSchema,
);

export default Product;
