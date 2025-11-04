import Product from "../models/Product";

// This script can be imported in server.ts to auto-seed in development
const dummyProducts = [
  {
    name: "Classic Leather Vest",
    slug: "classic-leather-vest",
    description:
      "Premium genuine leather vest with classic design. Perfect for casual and formal occasions.",
    shortDescription: "Premium genuine leather vest with classic design",
    sku: "LVEST-CL-001",
    category: "men-vests",
    tags: ["leather", "classic", "men", "premium"],
    images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800"],
    basePrice: 129.99,
    compareAtPrice: 179.99,
    stock: 50,
    status: "active" as const,
    featured: true,
    rating: 4.5,
    reviewCount: 24,
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
      "Durable denim work vest with multiple pockets. Perfect for outdoor activities.",
    shortDescription: "Durable denim work vest with multiple pockets",
    sku: "DVEST-WK-002",
    category: "men-vests",
    tags: ["denim", "work", "casual"],
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
    ],
    basePrice: 49.99,
    compareAtPrice: 69.99,
    stock: 75,
    status: "active" as const,
    featured: false,
    rating: 4.2,
    reviewCount: 18,
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
      "Luxurious silk vest for formal occasions. Elegant design with smooth texture.",
    shortDescription: "Luxurious silk vest for formal occasions",
    sku: "SVEST-EL-003",
    category: "men-vests",
    tags: ["silk", "formal", "elegant"],
    images: [
      "https://images.unsplash.com/photo-1594938298602-c8148c4dae35?w=800",
    ],
    basePrice: 199.99,
    compareAtPrice: 249.99,
    stock: 30,
    status: "active" as const,
    featured: true,
    rating: 4.8,
    reviewCount: 12,
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
      "Stylish casual vest for women. Comfortable fit with modern design.",
    shortDescription: "Stylish casual vest for women",
    sku: "WVEST-CA-004",
    category: "women-vests",
    tags: ["women", "casual", "comfortable"],
    images: [
      "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800",
    ],
    basePrice: 59.99,
    compareAtPrice: 79.99,
    stock: 60,
    status: "active" as const,
    featured: true,
    rating: 4.3,
    reviewCount: 31,
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
      "Lightweight athletic vest designed for sports and fitness activities.",
    shortDescription: "Lightweight athletic vest for sports",
    sku: "AVEST-PF-005",
    category: "sports-vests",
    tags: ["athletic", "sports", "fitness"],
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"],
    basePrice: 39.99,
    stock: 100,
    status: "active" as const,
    featured: false,
    rating: 4.6,
    reviewCount: 45,
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
];

export async function seedProductsIfEmpty() {
  try {
    // Only seed if database is empty
    const productCount = await Product.countDocuments();

    if (productCount === 0) {
      console.log("📦 No products found. Seeding database with dummy data...");
      await Product.insertMany(dummyProducts);
      console.log(`✅ Seeded ${dummyProducts.length} products`);
    } else {
      console.log(
        `✅ Database already has ${productCount} products. Skipping seed.`,
      );
    }
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    // Don't throw error - just log it, so server can still start
  }
}
