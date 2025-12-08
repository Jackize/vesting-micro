'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserOrders } from '@/lib/react-query/queries/orderQueries';
import { format } from 'date-fns';
import { Eye, Package } from 'lucide-react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const { data, isLoading, error } = useUserOrders();
  const orders = data?.orders || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">Failed to load orders</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium">Order #</th>
                  <th className="pb-3 text-left font-medium">Date</th>
                  <th className="pb-3 text-left font-medium">Customer</th>
                  <th className="pb-3 text-left font-medium">Items</th>
                  <th className="pb-3 text-left font-medium">Total</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                  <th className="pb-3 text-left font-medium">Payment</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-4">
                      <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                    </td>
                    <td className="py-4 text-sm">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{order.shippingAddress.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.shippingAddress.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{order.items.length}</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium">${order.total.toFixed(2)}</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end">
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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
