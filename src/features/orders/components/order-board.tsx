"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { updateOrderStatusAction } from "@/features/orders/actions/update-order-status";
import type {
  OrderStatus,
  OrderView,
} from "@/features/orders/types/order.types";
import { formatRupiah } from "@/lib/utils";

type TargetStatus = Extract<OrderStatus, "PREPARING" | "COMPLETED" | "CANCELLED">;

const ACTIONS: Record<
  OrderStatus,
  Array<{ label: string; target: TargetStatus; variant: "default" | "outline" | "destructive" }>
> = {
  PENDING_PAYMENT: [
    { label: "Cancel", target: "CANCELLED", variant: "outline" },
  ],
  PAID: [
    { label: "Start preparing", target: "PREPARING", variant: "default" },
    { label: "Cancel", target: "CANCELLED", variant: "outline" },
  ],
  PREPARING: [
    { label: "Mark completed", target: "COMPLETED", variant: "default" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrderBoard({ orders }: { orders: OrderView[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function updateStatus(orderId: string, target: TargetStatus) {
    setPendingId(orderId);
    const result = await updateOrderStatusAction({ orderId, status: target });
    setPendingId(null);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Incoming orders will appear here as customers check out."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {orders.map((order) => {
        const actions = ACTIONS[order.status];
        const latestPayment = order.payments[0];

        return (
          <Card key={order.id}>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <p className="font-mono text-sm font-semibold">
                  {order.orderNumber}
                </p>
                <p className="text-xs text-zinc-500">
                  {order.customerName} · {order.customerEmail}
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
                    <span>
                      {item.quantity}x {item.itemNameSnapshot}
                    </span>
                    <span className="text-zinc-500">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {order.notes ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  Notes: {order.notes}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="text-sm text-zinc-500">
                  Total{" "}
                  <span className="font-bold text-zinc-900 dark:text-zinc-50">
                    {formatRupiah(order.totalAmount)}
                  </span>
                  {latestPayment ? (
                    <span className="ml-2 text-xs">
                      · {latestPayment.provider} {latestPayment.status}
                    </span>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  {actions.length === 0 ? (
                    <span className="text-xs text-zinc-400">No actions</span>
                  ) : (
                    actions.map((action) => (
                      <Button
                        key={action.target}
                        size="sm"
                        variant={action.variant}
                        disabled={pendingId === order.id}
                        onClick={() => updateStatus(order.id, action.target)}
                      >
                        {pendingId === order.id ? "..." : action.label}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
