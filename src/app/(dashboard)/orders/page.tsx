import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { OrderList } from "@/features/orders/components/order-list";
import { getUserOrders } from "@/features/orders/queries/get-user-orders";
import { requireUser } from "@/lib/auth";

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((index) => (
        <Card key={index}>
          <CardContent className="space-y-3 p-6">
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My orders</h1>
        <p className="text-sm text-zinc-500">
          Track payment and kitchen progress for every order.
        </p>
      </div>

      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}

async function OrdersContent() {
  await requireUser();
  const orders = await getUserOrders();
  return <OrderList orders={orders} />;
}
