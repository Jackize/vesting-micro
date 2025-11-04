'use client';

import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { useFeaturedProducts } from '@/lib/react-query/queries/productQueries';
import Link from 'next/link';

export default function Home() {
  const { data, isLoading } = useFeaturedProducts(8);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-background px-4 py-24">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight">Welcome to Vestify</h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Your modern e-commerce platform for premium vests
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/products">
              <Button size="lg">Shop Now</Button>
            </Link>
            <Link href="/products/search">
              <Button size="lg" variant="outline">
                Search Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Link href="/products?featured=true">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading featured products...</p>
          </div>
        ) : data && data.products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No featured products available.</p>
          </div>
        )}
      </section>
    </main>
  );
}
