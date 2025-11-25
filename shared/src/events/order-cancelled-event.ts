import { Exchanges, Subjects } from "./subjects";

export interface OrderCancelledEvent {
  routingKey: Subjects.OrderCancelled;
  exchangeName: Exchanges.Order;
  data: {
    id: string;
    version: number;
    items: {
      productId: string;
      quantity: number;
    }[];
  };
}
