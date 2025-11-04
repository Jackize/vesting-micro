import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product";

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/vestify_products";
const DB_NAME = process.env.MONGODB_DB_NAME || "vestify_products";

const dummyProducts = [
  {
    name: "Classic Leather Vest",
    slug: "classic-leather-vest",
    description:
      "Premium genuine leather vest with classic design. Perfect for casual and formal occasions. Made from high-quality leather that ages beautifully.",
    shortDescription: "Premium genuine leather vest with classic design",
    sku: "LVEST-CL-001",
    category: "men-vests",
    tags: ["leather", "classic", "men", "premium"],
    images: [
      "https://thomasnguyentailor.com/wp-content/uploads/2024/07/vest-cuoi-chu-re-mau-xanh-navy.webp",
      "https://thomasnguyentailor.com/wp-content/uploads/2024/07/vest-cuoi-chu-re-mau-xanh-navy.webp",
    ],
    basePrice: 129.99,
    compareAtPrice: 179.99,
    stock: 50,
    status: "active",
    featured: true,
    rating: 4.5,
    reviewCount: 24,
    weight: 0.8,
    dimensions: {
      length: 70,
      width: 50,
      height: 2,
    },
    variants: [
      {
        name: "Size",
        value: "Small",
        sku: "LVEST-CL-001-S",
        stock: 15,
        price: 129.99,
      },
      {
        name: "Size",
        value: "Medium",
        sku: "LVEST-CL-001-M",
        stock: 20,
        price: 129.99,
      },
      {
        name: "Size",
        value: "Large",
        sku: "LVEST-CL-001-L",
        stock: 15,
        price: 129.99,
      },
    ],
  },
  {
    name: "Denim Work Vest",
    slug: "denim-work-vest",
    description:
      "Durable denim work vest with multiple pockets. Perfect for outdoor activities and casual wear. Made from high-quality denim fabric.",
    shortDescription: "Durable denim work vest with multiple pockets",
    sku: "DVEST-WK-002",
    category: "men-vests",
    tags: ["denim", "work", "casual", "pockets"],
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
    ],
    basePrice: 49.99,
    compareAtPrice: 69.99,
    stock: 75,
    status: "active",
    featured: false,
    rating: 4.2,
    reviewCount: 18,
    weight: 0.6,
    dimensions: {
      length: 68,
      width: 48,
      height: 2,
    },
    variants: [
      {
        name: "Size",
        value: "Small",
        sku: "DVEST-WK-002-S",
        stock: 25,
        price: 49.99,
      },
      {
        name: "Size",
        value: "Medium",
        sku: "DVEST-WK-002-M",
        stock: 30,
        price: 49.99,
      },
      {
        name: "Size",
        value: "Large",
        sku: "DVEST-WK-002-L",
        stock: 20,
        price: 49.99,
      },
    ],
  },
  {
    name: "Elegant Silk Vest",
    slug: "elegant-silk-vest",
    description:
      "Luxurious silk vest for formal occasions. Elegant design with smooth texture. Perfect for weddings, parties, and special events.",
    shortDescription: "Luxurious silk vest for formal occasions",
    sku: "SVEST-EL-003",
    category: "men-vests",
    tags: ["silk", "formal", "elegant", "luxury"],
    images: [
      "https://images.unsplash.com/photo-1594938298602-c8148c4dae35?w=800",
      "https://images.unsplash.com/photo-1594938298602-c8148c4dae35?w=800",
    ],
    basePrice: 199.99,
    compareAtPrice: 249.99,
    stock: 30,
    status: "active",
    featured: true,
    rating: 4.8,
    reviewCount: 12,
    weight: 0.4,
    dimensions: {
      length: 72,
      width: 52,
      height: 1.5,
    },
    variants: [
      {
        name: "Size",
        value: "Small",
        sku: "SVEST-EL-003-S",
        stock: 10,
        price: 199.99,
      },
      {
        name: "Size",
        value: "Medium",
        sku: "SVEST-EL-003-M",
        stock: 12,
        price: 199.99,
      },
      {
        name: "Size",
        value: "Large",
        sku: "SVEST-EL-003-L",
        stock: 8,
        price: 199.99,
      },
    ],
  },
  {
    name: "Women's Casual Vest",
    slug: "womens-casual-vest",
    description:
      "Stylish casual vest for women. Comfortable fit with modern design. Perfect for everyday wear and weekend outings.",
    shortDescription: "Stylish casual vest for women",
    sku: "WVEST-CA-004",
    category: "women-vests",
    tags: ["women", "casual", "comfortable", "modern"],
    images: [
      "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800",
      "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800",
    ],
    basePrice: 59.99,
    compareAtPrice: 79.99,
    stock: 60,
    status: "active",
    featured: true,
    rating: 4.3,
    reviewCount: 31,
    weight: 0.5,
    dimensions: {
      length: 65,
      width: 45,
      height: 2,
    },
    variants: [
      {
        name: "Size",
        value: "XS",
        sku: "WVEST-CA-004-XS",
        stock: 15,
        price: 59.99,
      },
      {
        name: "Size",
        value: "Small",
        sku: "WVEST-CA-004-S",
        stock: 20,
        price: 59.99,
      },
      {
        name: "Size",
        value: "Medium",
        sku: "WVEST-CA-004-M",
        stock: 15,
        price: 59.99,
      },
      {
        name: "Size",
        value: "Large",
        sku: "WVEST-CA-004-L",
        stock: 10,
        price: 59.99,
      },
    ],
  },
  {
    name: "Athletic Performance Vest",
    slug: "athletic-performance-vest",
    description:
      "Lightweight athletic vest designed for sports and fitness activities. Breathable fabric with moisture-wicking technology.",
    shortDescription: "Lightweight athletic vest for sports and fitness",
    sku: "AVEST-PF-005",
    category: "sports-vests",
    tags: ["athletic", "sports", "fitness", "breathable"],
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    ],
    basePrice: 39.99,
    stock: 100,
    status: "active",
    featured: false,
    rating: 4.6,
    reviewCount: 45,
    weight: 0.3,
    dimensions: {
      length: 70,
      width: 48,
      height: 1,
    },
    variants: [
      {
        name: "Size",
        value: "Small",
        sku: "AVEST-PF-005-S",
        stock: 30,
        price: 39.99,
      },
      {
        name: "Size",
        value: "Medium",
        sku: "AVEST-PF-005-M",
        stock: 35,
        price: 39.99,
      },
      {
        name: "Size",
        value: "Large",
        sku: "AVEST-PF-005-L",
        stock: 35,
        price: 39.99,
      },
    ],
  },
  {
    name: "Wool Winter Vest",
    slug: "wool-winter-vest",
    description:
      "Warm and cozy wool vest for cold weather. Premium wool blend with excellent insulation. Perfect for winter season.",
    shortDescription: "Warm and cozy wool vest for cold weather",
    sku: "WVEST-WN-006",
    category: "winter-vests",
    tags: ["wool", "winter", "warm", "cozy"],
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
    ],
    basePrice: 89.99,
    compareAtPrice: 119.99,
    stock: 40,
    status: "active",
    featured: true,
    rating: 4.7,
    reviewCount: 28,
    weight: 0.7,
    dimensions: {
      length: 72,
      width: 50,
      height: 3,
    },
    variants: [
      {
        name: "Size",
        value: "Small",
        sku: "WVEST-WN-006-S",
        stock: 12,
        price: 89.99,
      },
      {
        name: "Size",
        value: "Medium",
        sku: "WVEST-WN-006-M",
        stock: 15,
        price: 89.99,
      },
      {
        name: "Size",
        value: "Large",
        sku: "WVEST-WN-006-L",
        stock: 13,
        price: 89.99,
      },
    ],
  },
  {
    name: "Vintage Denim Vest",
    slug: "vintage-denim-vest",
    description:
      "Retro-style vintage denim vest with distressed finish. Unique design that adds character to any outfit.",
    shortDescription: "Retro-style vintage denim vest",
    sku: "DVEST-VT-007",
    category: "men-vests",
    tags: ["vintage", "denim", "retro", "distressed"],
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
    ],
    basePrice: 69.99,
    stock: 25,
    status: "active",
    featured: false,
    rating: 4.1,
    reviewCount: 15,
    weight: 0.6,
    dimensions: {
      length: 68,
      width: 48,
      height: 2,
    },
    variants: [
      {
        name: "Size",
        value: "Small",
        sku: "DVEST-VT-007-S",
        stock: 8,
        price: 69.99,
      },
      {
        name: "Size",
        value: "Medium",
        sku: "DVEST-VT-007-M",
        stock: 10,
        price: 69.99,
      },
      {
        name: "Size",
        value: "Large",
        sku: "DVEST-VT-007-L",
        stock: 7,
        price: 69.99,
      },
    ],
  },
  {
    name: "Business Formal Vest",
    slug: "business-formal-vest",
    description:
      "Professional business vest for formal wear. Perfect for office and business meetings. Classic design with modern fit.",
    shortDescription: "Professional business vest for formal wear",
    sku: "BVEST-BF-008",
    category: "formal-vests",
    tags: ["business", "formal", "professional", "office"],
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
    ],
    basePrice: 149.99,
    compareAtPrice: 199.99,
    stock: 35,
    status: "active",
    featured: true,
    rating: 4.9,
    reviewCount: 52,
    weight: 0.5,
    dimensions: {
      length: 70,
      width: 50,
      height: 2,
    },
    variants: [
      {
        name: "Size",
        value: "Small",
        sku: "BVEST-BF-008-S",
        stock: 10,
        price: 149.99,
      },
      {
        name: "Size",
        value: "Medium",
        sku: "BVEST-BF-008-M",
        stock: 15,
        price: 149.99,
      },
      {
        name: "Size",
        value: "Large",
        sku: "BVEST-BF-008-L",
        stock: 10,
        price: 149.99,
      },
    ],
  },
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
    });

    console.log("✅ Connected to MongoDB");

    // Clear existing products (optional - comment out if you want to keep existing data)
    const deleteResult = await Product.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing products`);

    // Insert dummy products
    const products = await Product.insertMany(dummyProducts);
    console.log(`✅ Created ${products.length} products`);

    // Display summary
    console.log("\n📊 Summary:");
    console.log(`- Total products: ${products.length}`);
    console.log(
      `- Active products: ${products.filter((p) => p.status === "active").length}`,
    );
    console.log(
      `- Featured products: ${products.filter((p) => p.featured).length}`,
    );
    console.log(
      `- Categories: ${[...new Set(products.map((p) => p.category))].join(", ")}`,
    );

    // Close connection
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  }
}

// Run seed script
seedProducts();
