import { OrderStatus, PaymentStatus } from "@vestify/shared";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import Order from "../../models/Order";
import Payment from "../../models/Payment";
import { getUserToken } from "../helpers/testHelpers";

// Mock the stripe configuration
jest.mock("../../config/stripe", () => ({
  stripe: {
    charges: {
      create: jest.fn().mockResolvedValue({ id: "ch_test_charge_id" }),
    },
  },
}));

describe("Create Payment Controller", () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a 404 when purchasing an order that does not exist", async () => {
    const token = getUserToken();
    await request(app)
      .post("/api/payments/create-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({
        token: "tok_visa",
        orderId: new mongoose.Types.ObjectId().toHexString(),
      })
      .expect(404);
  });

  it("returns a 401 when purchasing an order that does not belong to the user", async () => {
    const order = new Order({
      _id: new mongoose.Types.ObjectId().toHexString(),
      userId: new mongoose.Types.ObjectId().toHexString(),
      price: 20,
      status: OrderStatus.PENDING,
      currency: "usd",
      paymentMethod: "stripe",
    });
    await order.save();

    const token = getUserToken();
    await request(app)
      .post("/api/payments/create-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({
        token: "tok_visa",
        orderId: order.id,
      })
      .expect(401);
  });

  it("returns a 400 when purchasing a cancelled order", async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token = getUserToken(userId);
    const order = new Order({
      _id: new mongoose.Types.ObjectId().toHexString(),
      userId,
      price: 20,
      status: OrderStatus.CANCELLED,
      currency: "usd",
      paymentMethod: "stripe",
    });
    await order.save();

    await request(app)
      .post("/api/payments/create-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({
        orderId: order.id,
        token: "tok_visa",
      })
      .expect(400);
  });

  it("returns a 201 with valid inputs", async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token = getUserToken(userId);

    const order = new Order({
      _id: new mongoose.Types.ObjectId().toHexString(),
      userId,
      price: 2000,
      status: OrderStatus.PENDING,
      currency: "usd",
      paymentMethod: "stripe",
    });
    await order.save();

    await request(app)
      .post("/api/payments/create-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({
        token: "tok_visa",
        orderId: order.id,
      })
      .expect(201);

    const payment = await Payment.findOne({
      orderId: order.id,
    });
    expect(payment).not.toBeNull();
    expect(payment!.status).toEqual(PaymentStatus.PAID);
    expect(payment!.paymentIntentId).toEqual("ch_test_charge_id");
  });
});
