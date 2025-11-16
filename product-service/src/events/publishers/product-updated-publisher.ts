import {
  BasePublisher,
  Exchanges,
  ProductUpdatedEvent,
  Subjects,
} from "@vestify/shared";

export class ProductUpdatedPublisher extends BasePublisher<ProductUpdatedEvent> {
  routingKey: Subjects.ProductUpdated = Subjects.ProductUpdated;
  exchangeName: Exchanges.Product = Exchanges.Product;
}
