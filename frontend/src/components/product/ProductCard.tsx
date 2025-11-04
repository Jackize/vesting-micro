'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Product } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice;
  const discountPercentage = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            {product.images && product.images.length > 0 ? (
              <Image
                src={'/vest_1.png'}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            {hasDiscount && (
              <div className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
                -{discountPercentage}%
              </div>
            )}
            {product.featured && (
              <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                Featured
              </div>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-lg font-semibold text-white">Out of Stock</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="line-clamp-2 font-semibold leading-tight">{product.name}</h3>
            {product.shortDescription && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {product.shortDescription}
              </p>
            )}
            <div className="flex items-center gap-2">
              {product.rating && (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                  <span className="text-yellow-500">★</span>
                  {product.reviewCount && (
                    <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold">${product.basePrice.toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  ${product.compareAtPrice!.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button className="w-full" disabled={product.stock === 0}>
            {product.stock === 0 ? 'Out of Stock' : 'View Details'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
