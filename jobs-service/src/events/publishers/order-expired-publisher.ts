import {
  BasePublisher,
  Exchanges,
  OrderExpiredEvent,
  Subjects,
} from "@vestify/shared";

export class OrderExpiredPublisher extends BasePublisher<OrderExpiredEvent> {
  routingKey: Subjects.OrderExpired = Subjects.OrderExpired;
  exchangeName: Exchanges.Order = Exchanges.Order;
}
