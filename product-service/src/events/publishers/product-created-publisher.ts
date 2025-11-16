import {
  BasePublisher,
  Exchanges,
  ProductCreatedEvent,
  Subjects,
} from "@vestify/shared";

export class ProductCreatedPublisher extends BasePublisher<ProductCreatedEvent> {
  routingKey: Subjects.ProductCreated = Subjects.ProductCreated;
  exchangeName: Exchanges.Product = Exchanges.Product;
}
