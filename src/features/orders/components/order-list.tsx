import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { PayNowButton } from "@/features/orders/components/pay-now-button";
import type { OrderView } from "@/features/orders/types/order.types";
import { formatRupiah } from "@/lib/utils";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrderList({ orders }: { orders: OrderView[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Browse the menu and place your first order."
        action={
          <Button asChild>
            <Link href="/">Browse menu</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const latestPayment = order.payments[0];
        const hasValidLink = latestPayment?.isCheckoutUsable ?? false;

        return (
          <Card key={order.id}>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <p className="font-mono text-sm text-zinc-500">
                  {order.orderNumber}
                </p>
                <p className="text-xs text-zinc-400">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {item.quantity}x {item.itemNameSnapshot}
                    </span>
                    <span className="text-zinc-500">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {order.notes ? (
                <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  Notes: {order.notes}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="text-sm text-zinc-500">
                  Total{" "}
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>

                {order.status === "PENDING_PAYMENT" ? (
                  hasValidLink ? (
                    <Button asChild size="sm">
                      <a href={latestPayment.checkoutUrl!}>Continue payment</a>
                    </Button>
                  ) : (
                    <PayNowButton orderId={order.id} />
                  )
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
