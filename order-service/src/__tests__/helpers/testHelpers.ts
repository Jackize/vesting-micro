import mongoose from "mongoose";
import Order, { IOrder } from "../../models/Order";
import { generateToken } from "../../utils/jwt";

export const createTestOrder = async (orderData?: {
  userId?: mongoose.Types.ObjectId;
  items?: any[];
  shippingAddress?: any;
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  discount?: number;
  status?: string;
  paymentStatus?: string;
  expiresAt?: Date;
}): Promise<IOrder> => {
  const defaultOrder = {
    userId: orderData?.userId
      ? orderData.userId
      : new mongoose.Types.ObjectId().toString(),
    orderNumber: `ORD-${Date.now()}`,
    items: [
      {
        productId: "product123",
        productName: "Test Product",
        quantity: 1,
        price: 100,
      },
    ],
    shippingAddress: {
      fullName: "Test User",
      phone: "+1234567890",
      address: "123 Test St",
      city: "Test City",
      postalCode: "12345",
      country: "Test Country",
    },
    subtotal: 100,
    total: 115,
    shippingCost: 10,
    tax: 5,
    discount: 0,
    status: "pending",
    paymentStatus: "pending",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    ...orderData,
  };

  const order = await Order.create(defaultOrder);
  return order;
};

export const getAuthToken = async (
  userId?: string,
  role: string = "user",
): Promise<string> => {
  const testUserId = userId || new mongoose.Types.ObjectId().toString();
  return generateToken(testUserId, role, true);
};

export const getAdminToken = async (): Promise<string> => {
  const adminId = new mongoose.Types.ObjectId().toString();
  return generateToken(adminId, "admin", true);
};

export const validObjectId = (): string => {
  return new mongoose.Types.ObjectId().toString();
};

export const invalidObjectId = (): string => {
  return "invalid-id";
};
