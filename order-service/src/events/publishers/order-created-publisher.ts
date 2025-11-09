import { BasePublisher, OrderCreatedEvent, Subjects } from "@vestify/shared";

export class OrderCreatedPublisher extends BasePublisher<OrderCreatedEvent> {
  queueName: Subjects.OrderCreated = Subjects.OrderCreated;
}
