import {
  BasePublisher,
  Exchanges,
  OrderCreatedEvent,
  Subjects,
} from "@vestify/shared";

export class OrderCreatedPublisher extends BasePublisher<OrderCreatedEvent> {
  routingKey: Subjects.OrderCreated = Subjects.OrderCreated;
  exchangeName: Exchanges.Order = Exchanges.Order;
}
