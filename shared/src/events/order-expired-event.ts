import { Exchanges, Subjects } from "./subjects";

export interface OrderExpiredEvent {
  routingKey: Subjects.OrderExpired;
  exchangeName: Exchanges.Order;
  data: {
    id: string;
    userId: string;
    orderNumber: string;
    expiredAt: string;
  };
}
