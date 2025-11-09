import { BasePublisher, ProductCreatedEvent, Subjects } from "@vestify/shared";

export class ProductCreatedPublisher extends BasePublisher<ProductCreatedEvent> {
  queueName: Subjects.ProductCreated = Subjects.ProductCreated;
}
