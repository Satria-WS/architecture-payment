import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type {
  OrderStatus,
  OrderView,
  PaymentStatus,
} from "@/features/orders/types/order.types";

export async function getAllOrders(): Promise<OrderView[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return [];
  }

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
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
    customerName: order.user.name,
    customerEmail: order.user.email,
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
