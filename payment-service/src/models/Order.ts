import { OrderStatus } from "@vestify/shared";
import { model, Model, Schema } from "mongoose";

interface IOrder {
  id: string;
  version: number;
  userId: string;
  price: number;
  currency: string;
  paymentMethod: string;
  status: OrderStatus;
}

interface IOrderModel extends Model<IOrder> {
  createOrder(order: IOrder): Promise<IOrder>;
}

const OrderSchema: Schema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
  },
  {
    timestamps: true,
    collection: "orders",
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  },
);

// Indexes for performance
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });

OrderSchema.statics.createOrder = async function (order: IOrder) {
  const newOrder = new this(order);
  return await newOrder.save();
};

const Order = model<IOrder, IOrderModel>("Order", OrderSchema);

export default Order;
