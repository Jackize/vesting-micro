import { BaseListener, Exchanges, OrderStatus, PaymentStatus, PaymentSuccessEvent, Subjects } from "@vestify/shared";
import Order from "../../models/Order";

export class PaymentSuccessListener extends BaseListener<PaymentSuccessEvent> {
    routingKey: Subjects.PaymentSuccess = Subjects.PaymentSuccess;
    exchangeName: Exchanges.Payment = Exchanges.Payment;

    async handle(event: PaymentSuccessEvent["data"]) {
        try {
            const order = await Order.findById(event.orderId);
            if (!order) {
                console.log(`Order not found ${event.orderNumber}`);
                return;
            }

            order.status = OrderStatus.CONFIRMED;
            order.paymentStatus = PaymentStatus.PAID;
            await order.save();
        } catch (error) {
            throw error;
        }
    }
}