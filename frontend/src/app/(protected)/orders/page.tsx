'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useUserOrders } from '@/lib/react-query/queries/orderQueries';
import { format } from 'date-fns';
import { ChevronRight, CreditCard, Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function OrderHistoryPage() {
  const { data, isLoading, error } = useUserOrders();
  const orders = data?.orders || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'refunded':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Order History</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-3">
            <ShoppingBag className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Failed to load orders</h2>
          <p className="mb-4 text-muted-foreground">
            We couldn't retrieve your order history. Please try again later.
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Order History</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">No orders yet</h2>
            <p className="mb-6 text-muted-foreground">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link href="/products">
              <Button>Start Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order History</h1>
        <Link href="/products">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="border-b bg-muted/30 px-6 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Order Placed</p>
                    <p className="font-semibold">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Total</p>
                    <p className="font-semibold">${order.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Order #</p>
                    <p className="font-mono font-semibold">{order.orderNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    <Package className="h-3.5 w-3.5" />
                    <span className="capitalize">{order.status}</span>
                  </div>
                  <Link href={`/orders/${order.id}`}>
                    <Button size="sm" variant="outline" className="h-8 gap-1">
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-muted p-2">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                    </h3>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {order.items.map((item) => item.productName).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getPaymentStatusColor(
                        order.paymentStatus
                      )}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
