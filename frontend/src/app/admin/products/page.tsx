'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/lib/react-query/queries/productQueries';
import { Edit, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminProductsPage() {
  const { data, isLoading, error } = useProducts();
  const products = data?.products || [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Products</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Products</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">Failed to load products</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium">Product</th>
                  <th className="pb-3 text-left font-medium">Category</th>
                  <th className="pb-3 text-left font-medium">Price</th>
                  <th className="pb-3 text-left font-medium">Stock</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded border bg-muted">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/products/${product.slug}`}
                            className="font-medium hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="line-clamp-1 text-sm text-muted-foreground">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-4 font-medium">${product.basePrice.toFixed(2)}</td>
                    <td className="py-4">
                      <span
                        className={`${
                          product.stock > 10
                            ? 'text-green-600'
                            : product.stock > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          product.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.status === 'active' ? 'Active' : product.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
