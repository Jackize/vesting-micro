import { Subjects } from "./subjects";
export interface IOrderItem {
  productId: string;
  productName: string;
  productSlug?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface OrderCreatedEvent {
  queueName: Subjects.OrderCreated;
  data: {
    id: string;
    userId: string;
    orderNumber: string;
    items: IOrderItem[];
    shippingAddress: IShippingAddress;
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
  };
}
