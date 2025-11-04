'use client';

import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { useProductsByCategory } from '@/lib/react-query/queries/productQueries';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useProductsByCategory(category, { page, limit: 12 });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
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
        <h1 className="mb-2 text-3xl font-bold capitalize">{category.replace(/-/g, ' ')}</h1>
        {data && (
          <p className="text-muted-foreground">
            {data.pagination.total} product{data.pagination.total !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {data && data.products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

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
          <p className="text-muted-foreground">No products found in this category.</p>
        </div>
      )}
    </div>
  );
}
