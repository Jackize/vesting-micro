import { BasePublisher, ProductUpdatedEvent, Subjects } from "@vestify/shared";

export class ProductUpdatedPublisher extends BasePublisher<ProductUpdatedEvent> {
  queueName: Subjects.ProductUpdated = Subjects.ProductUpdated;
}
