import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { NormalizedWebhookPayload } from "@/lib/payment/types";

export type ApplyWebhookResult = {
  found: boolean;
  duplicate: boolean;
  amountMismatch: boolean;
  orderId?: string;
  orderStatus?: string;
};

function serializableRaw(raw: unknown): Prisma.InputJsonValue | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(raw)) as Prisma.InputJsonValue;
}

export async function applyPaymentWebhook(
  payload: NormalizedWebhookPayload
): Promise<ApplyWebhookResult> {
  const transaction = await db.paymentTransaction.findUnique({
    where: { externalId: payload.externalId },
    include: { order: true },
  });

  if (!transaction) {
    return { found: false, duplicate: false, amountMismatch: false };
  }

  const rawWebhookPayload = serializableRaw(payload.raw);

  if (payload.status === "PAID") {
    if (transaction.status === "PAID") {
      return {
        found: true,
        duplicate: true,
        amountMismatch: false,
        orderId: transaction.orderId,
        orderStatus: transaction.order.status,
      };
    }

    if (transaction.amount !== payload.amount) {
      return {
        found: true,
        duplicate: false,
        amountMismatch: true,
        orderId: transaction.orderId,
        orderStatus: transaction.order.status,
      };
    }

    const result = await db.$transaction(async (tx) => {
      const claimed = await tx.paymentTransaction.updateMany({
        where: { id: transaction.id, status: { not: "PAID" } },
        data: {
          status: "PAID",
          paidAt: payload.paidAt ?? new Date(),
          paymentMethod: payload.paymentMethod ?? null,
          rawWebhookPayload,
        },
      });

      if (claimed.count === 0) {
        const current = await tx.paymentTransaction.findUniqueOrThrow({
          where: { id: transaction.id },
          select: { orderId: true, order: { select: { status: true } } },
        });
        return {
          duplicate: true,
          orderId: current.orderId,
          orderStatus: current.order.status,
        };
      }

      const order = await tx.order.findUniqueOrThrow({
        where: { id: transaction.orderId },
        select: { status: true },
      });

      if (order.status === "PENDING_PAYMENT") {
        await tx.order.update({
          where: { id: transaction.orderId },
          data: { status: "PAID" },
        });

        return {
          duplicate: false,
          orderId: transaction.orderId,
          orderStatus: "PAID",
        };
      }

      return {
        duplicate: false,
        orderId: transaction.orderId,
        orderStatus: order.status,
      };
    });

    return {
      found: true,
      amountMismatch: false,
      ...result,
    };
  }

  if (payload.status === "EXPIRED" || payload.status === "FAILED") {
    await db.paymentTransaction.updateMany({
      where: {
        id: transaction.id,
        status: { notIn: ["PAID", "EXPIRED"] },
      },
      data: {
        status: payload.status,
        rawWebhookPayload,
      },
    });

    return {
      found: true,
      duplicate: transaction.status === payload.status,
      amountMismatch: false,
      orderId: transaction.orderId,
      orderStatus: transaction.order.status,
    };
  }

  return {
    found: true,
    duplicate: false,
    amountMismatch: false,
    orderId: transaction.orderId,
    orderStatus: transaction.order.status,
  };
}
