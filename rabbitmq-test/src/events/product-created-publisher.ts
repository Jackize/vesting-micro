import { BaseProducer } from "./baseProducer";
import { ProductCreatedEvent } from "./product-created-event";
import { Subject } from "./subject";

export class ProductCreatedPublisher extends BaseProducer<ProductCreatedEvent> {
  queueName: Subject.PRODUCT_CREATED = Subject.PRODUCT_CREATED;
}
