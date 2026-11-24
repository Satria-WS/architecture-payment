"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toFieldErrors } from "@/lib/validation";
import { canTransition } from "@/features/orders/order-state";
import { updateOrderStatusSchema } from "@/features/orders/schemas/order-schema";
import type { OrderStatus } from "@/features/orders/types/order.types";
import type { ActionResponse } from "@/types/action-response";

export async function updateOrderStatusAction(
  input: unknown
): Promise<ActionResponse<{ orderId: string; status: OrderStatus }>> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Only admins can update order status." };
  }

  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid status update.",
      errors: toFieldErrors(parsed.error),
    };
  }

  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { id: true, status: true },
  });

  if (!order) {
    return { success: false, message: "Order not found." };
  }

  const from = order.status as OrderStatus;
  const to = parsed.data.status;

  if (!canTransition(from, to)) {
    return {
      success: false,
      message: `Cannot move order from ${from} to ${to}.`,
    };
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: to },
    });

    if (to === "CANCELLED") {
      await tx.paymentTransaction.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
    }
  });

  revalidatePath("/admin/orders");
  revalidatePath("/orders");

  return {
    success: true,
    message: `Order moved to ${to.replaceAll("_", " ").toLowerCase()}.`,
    data: { orderId: order.id, status: to },
  };
}
