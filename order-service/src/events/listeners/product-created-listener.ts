import {
  BaseListener,
  Exchanges,
  ProductCreatedEvent,
  ProductStatus,
  Subjects,
} from "@vestify/shared";
import Product from "../../models/Product";

export class ProductCreatedListener extends BaseListener<ProductCreatedEvent> {
  routingKey: Subjects.ProductCreated = Subjects.ProductCreated;
  exchangeName: Exchanges.Product = Exchanges.Product;

  async handle(data: ProductCreatedEvent["data"]): Promise<void> {
    try {
      // Check if product already exists (in case of duplicate events)
      const existingProduct = await Product.findByProductId(data.id);

      if (existingProduct) {
        console.log(
          `⚠️ Product with ID ${data.id} already exists. Updating instead of creating.`,
        );
        // Update existing product
        existingProduct.name = data.name;
        existingProduct.slug = data.slug;
        existingProduct.sku = data.sku;
        existingProduct.status = data.status;
        existingProduct.basePrice = data.basePrice;
        existingProduct.stock = data.stock;
        existingProduct.variants = data.variants.map((v) => ({
          name: v.name,
          value: v.value,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          image: v.image,
        }));
        await existingProduct.save();
      } else {
        // Create new product
        const product = await Product.create({
          productId: data.id,
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          status: data.status as ProductStatus,
          basePrice: data.basePrice,
          stock: data.stock,
          variants: data.variants.map((v) => ({
            name: v.name,
            value: v.value,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            image: v.image,
          })),
        });
        console.log(
          `✅ Product created: ${product.name} (ID: ${product.productId})`,
        );
      }
    } catch (error) {
      console.error(`❌ Error processing product created event:`, error);
      throw error; // Re-throw to trigger message nack and requeue
    }
  }
}
