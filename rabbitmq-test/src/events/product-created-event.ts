import { Subject } from "./subject";

export interface ProductCreatedEvent {
  queueName: Subject.PRODUCT_CREATED;
  data: {
    id: string;
    name: string;
    price: number;
  };
}
