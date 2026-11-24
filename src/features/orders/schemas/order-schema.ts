import { z } from "zod";

export const cartItemSchema = z.object({
  menuItemId: z.string().min(1, "Menu item is required."),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1.")
    .max(99, "Quantity is too large."),
});

export const createOrderSchema = z.object({
  items: z
    .array(cartItemSchema)
    .min(1, "Your cart is empty.")
    .max(50, "Too many distinct items."),
  notes: z.string().trim().max(500, "Notes are too long.").optional(),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PREPARING", "COMPLETED", "CANCELLED"]),
});

export const retryPaymentSchema = z.object({
  orderId: z.string().min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
