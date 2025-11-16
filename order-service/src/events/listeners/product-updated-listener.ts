import {
  BaseListener,
  Exchanges,
  ProductUpdatedEvent,
  Subjects,
} from "@vestify/shared";
import Product from "../../models/Product";

export class ProductUpdatedListener extends BaseListener<ProductUpdatedEvent> {
  routingKey: Subjects.ProductUpdated = Subjects.ProductUpdated;
  exchangeName: Exchanges.Product = Exchanges.Product;

  async handle(data: ProductUpdatedEvent["data"]): Promise<void> {
    try {
      // Find existing product
      const product = await Product.findByProductId(data.id);

      if (!product) {
        console.warn(
          `⚠️ Product with ID ${data.id} not found. Cannot update. This might be a race condition - product may be created soon.`,
        );
        return; // Don't throw error, just log warning
      }

      // Update fields if provided
      if (data.name !== undefined) {
        product.name = data.name;
      }
      if (data.slug !== undefined) {
        product.slug = data.slug;
      }
      if (data.sku !== undefined) {
        product.sku = data.sku;
      }
      if (data.status !== undefined) {
        product.status = data.status;
      }
      if (data.basePrice !== undefined) {
        product.basePrice = data.basePrice;
      }
      if (data.stock !== undefined) {
        product.stock = data.stock;
      }
      if (data.variants !== undefined) {
        product.variants = data.variants.map((v: any) => ({
          name: v.name,
          value: v.value,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          image: v.image,
        }));
      }

      await product.save();
      console.log(
        `✅ Product updated: ${product.name} (ID: ${product.productId})`,
      );
    } catch (error) {
      console.error(`❌ Error processing product updated event:`, error);
      throw error; // Re-throw to trigger message nack and requeue
    }
  }
}
