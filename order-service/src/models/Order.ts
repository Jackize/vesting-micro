import { OrderStatus, PaymentStatus } from "@vestify/shared";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrderItem {
  productId: string;
  productName: string;
  productSlug?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  calculateTotal(): void;
}

export interface IOrderModel extends Model<IOrder> {
  findByOrderNumber(orderNumber: string): Promise<IOrder | null>;
  findByUserId(userId: string): Promise<IOrder[]>;
  findExpiredOrders(): Promise<IOrder[]>;
}

const OrderItemSchema: Schema = new Schema<IOrderItem>(
  {
    productId: {
      type: String,
      required: [true, "Product ID is required"],
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
    },
    productSlug: {
      type: String,
    },
    variantId: {
      type: String,
    },
    variantName: {
      type: String,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be non-negative"],
    },
    image: {
      type: String,
    },
  },
  { _id: false },
);

const ShippingAddressSchema: Schema = new Schema<IShippingAddress>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
  },
  { _id: false },
);

const OrderSchema: Schema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      index: true,
    },
    orderNumber: {
      type: String,
      required: false,
      unique: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: [true, "Order items are required"],
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "Order must have at least one item",
      },
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: [true, "Shipping address is required"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal must be non-negative"],
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Shipping cost must be non-negative"],
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Tax must be non-negative"],
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Discount must be non-negative"],
    },
    total: {
      type: Number,
      required: false,
      min: [0, "Total must be non-negative"],
    },
    status: {
      type: String,
      enum: OrderStatus,
      default: OrderStatus.PENDING,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: PaymentStatus,
      default: PaymentStatus.PENDING,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    }
  },
  {
    timestamps: true,
    collection: "orders",
  },
);

// Indexes for performance
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ expiresAt: 1 });

// Generate unique order number before saving
OrderSchema.pre("save", async function (next) {
  if (!this.isNew || this.orderNumber) {
    return next();
  }

  try {
    // Generate order number: ORD-YYYYMMDD-HHMMSS-XXXX
    const now = new Date();
    const userId = (this.userId as mongoose.Types.ObjectId).toString();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.orderNumber = `ORD-${userId}-${dateStr}-${timeStr}-${random}`;

    // Set expiration time to 15 minutes from now
    if (!this.expiresAt) {
      this.expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    }

    // Calculate total if not set
    if (
      !this.total ||
      this.isModified("items") ||
      this.isModified("discount")
    ) {
      (this as unknown as IOrder).calculateTotal();
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check if order is expired
OrderSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt && this.status === OrderStatus.PENDING;
};

// Instance method to calculate total
OrderSchema.methods.calculateTotal = function (): void {
  this.subtotal = this.items.reduce(
    (sum: number, item: IOrderItem) => sum + item.price * item.quantity,
    0,
  );
  this.total = this.subtotal + this.shippingCost + this.tax - this.discount;
};

// Static method to find order by order number
OrderSchema.statics.findByOrderNumber = async function (
  orderNumber: string,
): Promise<IOrder | null> {
  return this.findOne({ orderNumber });
};

// Static method to find orders by user ID
OrderSchema.statics.findByUserId = async function (
  userId: string,
): Promise<IOrder[]> {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Static method to find expired orders
OrderSchema.statics.findExpiredOrders = async function (): Promise<IOrder[]> {
  return this.find({
    expiresAt: { $lt: new Date() },
    status: OrderStatus.PENDING,
  });
};

// Transform output when converting to JSON
OrderSchema.set("toJSON", {
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Order: IOrderModel = mongoose.model<IOrder, IOrderModel>(
  "Order",
  OrderSchema,
);

export default Order;
