'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProductBySlug } from '@/lib/react-query/queries/productQueries';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: product, isLoading, error } = useProductBySlug(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="mb-4 text-destructive">Product not found.</p>
          <Link href="/products">
            <Button variant="outline">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice;
  const discountPercentage = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/products" className="text-primary hover:underline">
          ← Back to Products
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
            {product.images && product.images.length > 0 ? (
              <Image
                src={'/vest_1.png'}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.slice(1, 5).map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted"
                >
                  <Image
                    src={'/vest_1.png'}
                    alt={`${product.name} - Image ${index + 2}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 12.5vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              {product.featured && (
                <span className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                  Featured
                </span>
              )}
              {hasDiscount && (
                <span className="rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
                  -{discountPercentage}% OFF
                </span>
              )}
            </div>
            <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
            {product.shortDescription && (
              <p className="text-lg text-muted-foreground">{product.shortDescription}</p>
            )}
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{product.rating.toFixed(1)}</span>
              <span className="text-yellow-500">★★★★★</span>
              {product.reviewCount && (
                <span className="text-muted-foreground">
                  ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold">${product.basePrice.toFixed(2)}</span>
            {hasDiscount && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  ${product.compareAtPrice!.toFixed(2)}
                </span>
                <span className="text-lg text-destructive">Save {discountPercentage}%</span>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div>
            {product.stock > 0 ? (
              <p className="text-green-600">In Stock ({product.stock} available)</p>
            ) : (
              <p className="text-destructive">Out of Stock</p>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {product.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded border p-2"
                    >
                      <div>
                        <span className="font-medium">
                          {variant.name}: {variant.value}
                        </span>
                        {variant.price && variant.price !== product.basePrice && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            (+${(variant.price - product.basePrice).toFixed(2)})
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button size="lg" className="flex-1" disabled={product.stock === 0}>
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button size="lg" variant="outline">
              Wishlist
            </Button>
          </div>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">SKU:</span> {product.sku}
              </div>
              <div>
                <span className="font-medium">Category:</span>{' '}
                <Link
                  href={`/products/category/${product.category}`}
                  className="text-primary hover:underline"
                >
                  {product.category}
                </Link>
              </div>
              {product.tags && product.tags.length > 0 && (
                <div>
                  <span className="font-medium">Tags:</span>{' '}
                  {product.tags.map((tag, index) => (
                    <span key={index} className="text-primary">
                      {tag}
                      {index < product.tags!.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
              {product.weight && (
                <div>
                  <span className="font-medium">Weight:</span> {product.weight} kg
                </div>
              )}
              {product.dimensions && (
                <div>
                  <span className="font-medium">Dimensions:</span> {product.dimensions.length} ×{' '}
                  {product.dimensions.width} × {product.dimensions.height} cm
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none whitespace-pre-wrap">{product.description}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Video */}
      {product.videoUrl && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Product Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <iframe
                  src={product.videoUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
