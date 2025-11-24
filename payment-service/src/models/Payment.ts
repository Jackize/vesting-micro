import { PaymentStatus } from "@vestify/shared";
import { model, Model, Schema } from "mongoose";

interface IPayment {
  orderId: string;
  status: PaymentStatus;
  paymentIntentId: string;
}

interface IPaymentModel extends Model<IPayment> {
  createPayment(payment: IPayment): Promise<IPayment>;
}

const PaymentSchema: Schema = new Schema<IPayment>(
  {
    orderId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "payments",
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  },
);

PaymentSchema.statics.createPayment = async function (payment: IPayment) {
  const newPayment = new this(payment);
  return await newPayment.save();
};

const Payment = model<IPayment, IPaymentModel>("Payment", PaymentSchema);

export default Payment;
