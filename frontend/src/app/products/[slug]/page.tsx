'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateOrder } from '@/lib/react-query/queries/orderQueries';
import { useProductBySlug } from '@/lib/react-query/queries/productQueries';
import { useAuthStore } from '@/lib/store/authStore';
import { CreateOrderInput, ShippingAddress } from '@/types/order';
import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { data: product, isLoading, error } = useProductBySlug(slug);
  const { user } = useAuthStore();
  const createOrderMutation = useCreateOrder();

  // State for order
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update shipping address when user changes
  useEffect(() => {
    if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

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

  // Get selected variant price
  const selectedVariant =
    selectedVariantIndex !== null ? product.variants[selectedVariantIndex] : null;
  const itemPrice = selectedVariant?.price || product.basePrice;
  const itemSubtotal = itemPrice * quantity;

  // Check if user is authenticated
  const isAuthenticated = !!Cookies.get('auth_token');

  // Handle Buy button click
  const handleBuyClick = () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (product.stock === 0) {
      return;
    }

    setShowOrderForm(true);
  };

  // Handle order submission
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData: CreateOrderInput = {
        items: [
          {
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            variantId: selectedVariantIndex !== null ? selectedVariantIndex.toString() : undefined,
            variantName: selectedVariant
              ? `${selectedVariant.name}: ${selectedVariant.value}`
              : undefined,
            quantity,
            price: itemPrice,
            image: product.images?.[0],
          },
        ],
        shippingAddress,
        shippingCost: 10, // Default shipping cost
        tax: itemSubtotal * 0.1, // 10% tax
        discount: 0,
      };

      const order = await createOrderMutation.mutateAsync(orderData);

      // Show success message and redirect to order confirmation
      router.push(`/orders/${order.id}`);
    } catch (error: any) {
      // Error handling - if 401, redirect is already handled by API client
      if (error.response?.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else {
        alert(`Failed to create order: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4">
              <Label htmlFor="quantity">Quantity:</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, Math.min(val, product.stock)));
                  }}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Subtotal: ${itemSubtotal.toFixed(2)}
              </span>
            </div>
          )}

          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <Label>Select Option:</Label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant, index) => (
                  <Button
                    key={index}
                    variant={selectedVariantIndex === index ? 'default' : 'outline'}
                    onClick={() => setSelectedVariantIndex(index)}
                    disabled={variant.stock === 0}
                    className="justify-start"
                  >
                    {variant.name}: {variant.value}
                    {variant.stock === 0 && ' (Out of Stock)'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              disabled={product.stock === 0}
              onClick={handleBuyClick}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </Button>
            <Button size="lg" variant="outline" disabled={product.stock === 0}>
              Add to Cart
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

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Complete Your Order</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowOrderForm(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                {/* Order Summary */}
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h3 className="mb-2 font-semibold">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{product.name}</span>
                      <span>
                        ${itemPrice.toFixed(2)} × {quantity}
                      </span>
                    </div>
                    {selectedVariant && (
                      <div className="pl-4 text-xs text-muted-foreground">
                        {selectedVariant.name}: {selectedVariant.value}
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Subtotal:</span>
                      <span>${itemSubtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Shipping Address</h3>

                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      required
                      value={shippingAddress.fullName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      required
                      value={shippingAddress.address}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, address: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        required
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, city: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        required
                        value={shippingAddress.postalCode}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      required
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, country: e.target.value })
                      }
                    />
                  </div>

                  {shippingAddress.state !== undefined && (
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state || ''}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, state: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Order Total */}
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${itemSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>$10.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%):</span>
                      <span>${(itemSubtotal * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                      <span>Total:</span>
                      <span>${(itemSubtotal + 10 + itemSubtotal * 0.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowOrderForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting || !isAuthenticated}
                  >
                    {isSubmitting ? 'Creating Order...' : 'Place Order'}
                  </Button>
                </div>

                {!isAuthenticated && (
                  <p className="text-center text-sm text-destructive">
                    Please log in to place an order
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
