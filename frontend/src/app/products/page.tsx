'use client';

import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCategories, useProducts } from '@/lib/react-query/queries/productQueries';
import { ProductListParams } from '@/types/product';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProductsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ProductListParams>({
    page: 1,
    limit: 12,
    sort: 'newest',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useProducts(filters);
  const { data: categoriesData } = useCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      search: searchQuery || undefined,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof ProductListParams, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handleCategoryChange = (category: string) => {
    if (category) {
      // Navigate to category page
      router.push(`/products/category/${encodeURIComponent(category)}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-destructive">Error loading products. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">All Products</h1>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4 rounded-lg border bg-card p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <Select
                value={filters.category || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">All Categories</option>
                {categoriesData?.categories.map((category) => (
                  <option key={category} value={category}>
                    {category
                      .split('-')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Min Price</label>
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) =>
                  handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : '')
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Max Price</label>
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) =>
                  handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : '')
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Sort By</label>
              <Select
                value={filters.sort || 'newest'}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="rating">Highest Rated</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {data && data.products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(data.pagination.page - 1)}
                disabled={data.pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(data.pagination.page + 1)}
                disabled={data.pagination.page === data.pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No products found.</p>
        </div>
      )}
    </div>
  );
}
