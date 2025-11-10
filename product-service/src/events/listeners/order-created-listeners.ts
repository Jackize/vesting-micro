import { BaseListener, OrderCreatedEvent, Subjects } from "@vestify/shared";
import mongoose from "mongoose";
import Product from "../../models/Product";

interface ValidationError {
  productId: string;
  productName: string;
  reason: string;
}

export class OrderCreatedListener extends BaseListener<OrderCreatedEvent> {
  queueName: Subjects.OrderCreated = Subjects.OrderCreated;

  async handle(data: OrderCreatedEvent["data"]): Promise<void> {
    console.log(
      `📦 Processing order validation for order: ${data.orderNumber}`,
    );
    console.log(`   Order ID: ${data.id}`);
    console.log(`   User ID: ${data.userId}`);
    console.log(`   Items count: ${data.items.length}`);

    const errors: ValidationError[] = [];
    const productIds = data.items.map((item) => item.productId);

    // Fetch all products in parallel for better performance
    const products = await Product.find({
      _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    // Create a map for quick lookup
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // Validate each item
    for (const item of data.items) {
      const productId = item.productId;
      const product = productMap.get(productId);

      // Check if product exists
      if (!product) {
        errors.push({
          productId,
          productName: item.productName,
          reason: "Product not found",
        });
        console.error(
          `❌ Product validation failed: ${item.productName} (ID: ${productId}) - Product not found`,
        );
        continue;
      }

      // Check product status
      if (product.status !== "active") {
        errors.push({
          productId,
          productName: item.productName,
          reason: `Product status is '${product.status}' (must be 'active')`,
        });
        console.error(
          `❌ Product validation failed: ${item.productName} (ID: ${productId}) - Status: ${product.status}`,
        );
        continue;
      }

      // Check stock availability
      if (item.variantId) {
        // Validate variant-based product
        const variant = this.findVariant(
          product,
          item.variantId,
          item.variantName,
        );

        if (!variant) {
          errors.push({
            productId,
            productName: item.productName,
            reason: `Variant not found (variantId: ${item.variantId}, variantName: ${item.variantName})`,
          });
          console.error(
            `❌ Product validation failed: ${item.productName} (ID: ${productId}) - Variant not found`,
          );
          continue;
        }

        if (variant.stock < item.quantity) {
          errors.push({
            productId,
            productName: item.productName,
            reason: `Insufficient variant stock. Available: ${variant.stock}, Requested: ${item.quantity}`,
          });
          console.error(
            `❌ Product validation failed: ${item.productName} (ID: ${productId}) - Insufficient variant stock (Available: ${variant.stock}, Requested: ${item.quantity})`,
          );
          continue;
        }

        console.log(
          `✅ Variant validated: ${item.productName} - ${item.variantName} (Stock: ${variant.stock}, Requested: ${item.quantity})`,
        );
      } else {
        // Validate product without variant
        if (product.stock < item.quantity) {
          errors.push({
            productId,
            productName: item.productName,
            reason: `Insufficient product stock. Available: ${product.stock}, Requested: ${item.quantity}`,
          });
          console.error(
            `❌ Product validation failed: ${item.productName} (ID: ${productId}) - Insufficient stock (Available: ${product.stock}, Requested: ${item.quantity})`,
          );
          continue;
        }

        // Check if product has variants but no variant was specified
        if (product.variants && product.variants.length > 0) {
          errors.push({
            productId,
            productName: item.productName,
            reason:
              "Product has variants but no variant was specified in order",
          });
          console.error(
            `❌ Product validation failed: ${item.productName} (ID: ${productId}) - Product has variants but no variant specified`,
          );
          continue;
        }

        console.log(
          `✅ Product validated: ${item.productName} (Stock: ${product.stock}, Requested: ${item.quantity})`,
        );
      }
    }

    // Summary
    if (errors.length > 0) {
      console.error(
        `\n❌ Order validation FAILED for order ${data.orderNumber}`,
      );
      console.error(`   Total errors: ${errors.length}`);
      console.error(`   Errors:`);
      errors.forEach((error, index) => {
        console.error(
          `   ${index + 1}. ${error.productName} (ID: ${error.productId}): ${error.reason}`,
        );
      });
      console.error(
        `\n⚠️ Order ${data.orderNumber} cannot be fulfilled due to validation errors.`,
      );
      console.error(
        `   Please review the errors above and update the order or product inventory.`,
      );
    } else {
      console.log(`\n✅ Order validation PASSED for order ${data.orderNumber}`);
      console.log(`   All ${data.items.length} items are valid and in stock.`);
    }
  }

  /**
   * Find variant by variantId or variantName
   * variantId could be an index (string number) or a variant identifier
   */
  private findVariant(
    product: any,
    variantId?: string,
    variantName?: string,
  ): { name: string; value: string; stock: number } | null {
    if (!product.variants || product.variants.length === 0) {
      return null;
    }

    // Try to find by index if variantId is a number
    if (variantId) {
      const index = parseInt(variantId, 10);
      if (!isNaN(index) && index >= 0 && index < product.variants.length) {
        return product.variants[index];
      }
    }

    // Try to find by variantName (format: "Name:Value" or just "Value")
    if (variantName) {
      const variant = product.variants.find((v: any) => {
        const fullName = `${v.name}:${v.value}`;
        return fullName === variantName || v.value === variantName;
      });
      if (variant) {
        return variant;
      }
    }

    // Try to find by matching variantId as a string identifier
    if (variantId) {
      const variant = product.variants.find((v: any, index: number) => {
        return (
          index.toString() === variantId || `${v.name}:${v.value}` === variantId
        );
      });
      if (variant) {
        return variant;
      }
    }

    return null;
  }
}
