import { Suspense } from "react";

import { OrderBoard } from "@/features/orders/components/order-board";
import { getAllOrders } from "@/features/orders/queries/get-all-orders";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kitchen board</h1>
        <p className="text-sm text-zinc-500">
          Move paid orders through preparation and completion.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        }
      >
        <AdminOrdersContent />
      </Suspense>
    </div>
  );
}

async function AdminOrdersContent() {
  const orders = await getAllOrders();
  return <OrderBoard orders={orders} />;
}
