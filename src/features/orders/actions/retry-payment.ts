"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payment/factory";
import { PaymentGatewayError } from "@/lib/payment/types";
import { generateExternalId } from "@/lib/utils";
import { toFieldErrors } from "@/lib/validation";
import { retryPaymentSchema } from "@/features/orders/schemas/order-schema";
import type { ActionResponse } from "@/types/action-response";

type RetryPaymentResult = {
  orderId: string;
  checkoutUrl: string;
};

export async function retryPaymentAction(
  input: unknown
): Promise<ActionResponse<RetryPaymentResult>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Please sign in first." };
  }

  const parsed = retryPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid order.",
      errors: toFieldErrors(parsed.error),
    };
  }

  const order = await db.order.findFirst({
    where: { id: parsed.data.orderId, userId: user.id },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    return { success: false, message: "Order not found." };
  }

  if (order.status !== "PENDING_PAYMENT") {
    return {
      success: false,
      message: "This order is not awaiting payment.",
    };
  }

  const reusable = order.payments.find(
    (payment) =>
      payment.status === "PENDING" &&
      payment.checkoutUrl &&
      payment.expiresAt.getTime() > Date.now()
  );

  if (reusable?.checkoutUrl) {
    return {
      success: true,
      message: "Existing payment link is still valid.",
      data: { orderId: order.id, checkoutUrl: reusable.checkoutUrl },
    };
  }

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

  const externalId = generateExternalId();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const transaction = await db.paymentTransaction.create({
    data: {
      orderId: order.id,
      provider: provider.name,
      externalId,
      amount: order.totalAmount,
      status: "PENDING",
      expiresAt,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const invoice = await provider.createInvoice({
      externalId,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      description: `Order ${order.orderNumber}`,
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
      message: "Payment link created.",
      data: { orderId: order.id, checkoutUrl: invoice.checkoutUrl },
    };
  } catch (error) {
    await db.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });

    return {
      success: false,
      message:
        error instanceof PaymentGatewayError
          ? error.message
          : "Could not create a payment link. Please try again.",
    };
  }
}
