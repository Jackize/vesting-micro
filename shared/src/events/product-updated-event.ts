import { ProductStatus } from "../types/product-status";
import { IProductVariant } from "./product-created-event";
import { Exchanges, Subjects } from "./subjects";

export interface ProductUpdatedEvent {
  routingKey: Subjects.ProductUpdated;
  exchangeName: Exchanges.Product;
  data: {
    id: string;
    name?: string;
    slug?: string;
    sku?: string;
    status?: ProductStatus;
    basePrice?: number;
    stock?: number;
    variants?: IProductVariant[];
    updatedAt: Date;
  };
}
