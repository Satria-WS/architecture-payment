"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payment/factory";
import { PaymentGatewayError } from "@/lib/payment/types";
import { generateExternalId, generateOrderNumber } from "@/lib/utils";
import { toFieldErrors } from "@/lib/validation";
import { createOrderSchema } from "@/features/orders/schemas/order-schema";
import type { ActionResponse } from "@/types/action-response";

type CreateOrderResult = {
  orderId: string;
  orderNumber?: string;
  checkoutUrl?: string;
};

export async function createOrderAction(
  input: unknown
): Promise<ActionResponse<CreateOrderResult>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "Please sign in before checking out.",
      errors: { auth: ["Sign in required."] },
    };
  }

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please review your cart.",
      errors: toFieldErrors(parsed.error),
    };
  }

  const merged = new Map<string, number>();
  for (const item of parsed.data.items) {
    merged.set(item.menuItemId, (merged.get(item.menuItemId) ?? 0) + item.quantity);
  }

  const menuItems = await db.menuItem.findMany({
    where: {
      id: { in: [...merged.keys()] },
      isAvailable: true,
    },
  });

  if (menuItems.length !== merged.size) {
    return {
      success: false,
      message: "One or more menu items are no longer available.",
    };
  }

  const orderItems = menuItems.map((item) => {
    const quantity = merged.get(item.id) ?? 0;
    return {
      menuItemId: item.id,
      itemNameSnapshot: item.name,
      quantity,
      unitPrice: item.price,
      subtotal: item.price * quantity,
    };
  });

  const totalAmount = orderItems.reduce((total, item) => total + item.subtotal, 0);
  const orderNumber = generateOrderNumber();
  const externalId = generateExternalId();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let provider;
  try {
    provider = getPaymentProvider();
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Payment provider is not configured.",
    };
  }

  const { order, transaction } = await db.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: user.id,
        totalAmount,
        status: "PENDING_PAYMENT",
        notes: parsed.data.notes?.trim() || null,
        items: { create: orderItems },
      },
    });

    const createdTransaction = await tx.paymentTransaction.create({
      data: {
        orderId: createdOrder.id,
        provider: provider.name,
        externalId,
        amount: totalAmount,
        status: "PENDING",
        expiresAt,
      },
    });

    return { order: createdOrder, transaction: createdTransaction };
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const invoice = await provider.createInvoice({
      externalId,
      orderNumber,
      amount: totalAmount,
      description: `Order ${orderNumber}`,
      customer: { name: user.name, email: user.email },
      successRedirectUrl: `${appUrl}/orders?payment=success`,
      failureRedirectUrl: `${appUrl}/orders?payment=failed`,
      expiresAt,
    });

    await db.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        checkoutUrl: invoice.checkoutUrl,
        expiresAt: invoice.expiresAt,
      },
    });

    revalidatePath("/orders");

    return {
      success: true,
      message: "Order created. Redirecting to payment...",
      data: {
        orderId: order.id,
        orderNumber,
        checkoutUrl: invoice.checkoutUrl,
      },
    };
  } catch (error) {
    await db.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });

    revalidatePath("/orders");

    return {
      success: false,
      message:
        error instanceof PaymentGatewayError
          ? `Order ${orderNumber} was created, but payment setup failed: ${error.message}`
          : `Order ${orderNumber} was created, but payment setup failed. You can retry payment from your orders page.`,
      data: { orderId: order.id, orderNumber },
    };
  }
}
