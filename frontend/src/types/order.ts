export interface OrderItem {
  productId: string;
  productName: string;
  productSlug?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'expired';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod?: string;
  paymentIntentId?: string;
  expiresAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingCost?: number;
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface CreateOrderResponse {
  order: Order;
}
