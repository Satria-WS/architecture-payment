import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type {
  OrderStatus,
  OrderView,
  PaymentStatus,
} from "@/features/orders/types/order.types";

export async function getUserOrders(): Promise<OrderView[]> {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { itemNameSnapshot: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  const now = Date.now();

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    status: order.status as OrderStatus,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      itemNameSnapshot: item.itemNameSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    payments: order.payments.map((payment) => ({
      id: payment.id,
      provider: payment.provider,
      externalId: payment.externalId,
      checkoutUrl: payment.checkoutUrl,
      status: payment.status as PaymentStatus,
      amount: payment.amount,
      expiresAt: payment.expiresAt.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
      isCheckoutUsable:
        payment.status === "PENDING" &&
        !!payment.checkoutUrl &&
        payment.expiresAt.getTime() > now,
    })),
  }));
}
