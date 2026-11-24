import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
} from "@/features/orders/order-state";
import type { OrderStatus } from "@/features/orders/types/order.types";

const VARIANTS: Record<OrderStatus, NonNullable<BadgeProps["variant"]>> = {
  PENDING_PAYMENT: "warning",
  PAID: "success",
  PREPARING: "default",
  COMPLETED: "secondary",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANTS[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
