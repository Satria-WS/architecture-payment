import "server-only";

import { db } from "@/lib/db";
import { verifyDummyToken } from "@/lib/payment/signature";

export type DummyCheckoutView = {
  externalId: string;
  orderNumber: string;
  amount: number;
  status: string;
  paymentStatus: string;
  expiresAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    subtotal: number;
  }>;
};

export async function getPaymentByExternalId(
  externalId: string,
  token: string | undefined
): Promise<DummyCheckoutView | null> {
  if (!token || !verifyDummyToken(externalId, token)) {
    return null;
  }

  const payment = await db.paymentTransaction.findUnique({
    where: { externalId },
    include: {
      order: {
        include: {
          items: { orderBy: { itemNameSnapshot: "asc" } },
        },
      },
    },
  });

  if (!payment) {
    return null;
  }

  return {
    externalId: payment.externalId,
    orderNumber: payment.order.orderNumber,
    amount: payment.amount,
    status: payment.order.status,
    paymentStatus: payment.status,
    expiresAt: payment.expiresAt.toISOString(),
    items: payment.order.items.map((item) => ({
      id: item.id,
      name: item.itemNameSnapshot,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  };
}
