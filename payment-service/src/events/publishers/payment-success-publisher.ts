import {
  BasePublisher,
  Exchanges,
  PaymentSuccessEvent,
  Subjects,
} from "@vestify/shared";

export class PaymentSuccessPublisher extends BasePublisher<PaymentSuccessEvent> {
  routingKey: Subjects.PaymentSuccess = Subjects.PaymentSuccess;
  exchangeName: Exchanges.Payment = Exchanges.Payment;
}
