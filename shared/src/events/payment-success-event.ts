import { Exchanges, Subjects } from "./subjects";

export interface PaymentSuccessEvent {
    routingKey: Subjects.PaymentSuccess;
    exchangeName: Exchanges.Payment;
    data: {
        id: string;
        orderId: string;
        paymentIntentId: string;
    };
}