import { ProductStatus } from "../types/product-status";
import { IProductVariant } from "./product-created-event";
import { Subjects } from "./subjects";

export interface ProductUpdatedEvent {
  queueName: Subjects.ProductUpdated;
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
