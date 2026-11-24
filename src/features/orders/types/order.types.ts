export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

export type CartLine = {
  menuItemId: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  quantity: number;
};

export type OrderItemView = {
  id: string;
  itemNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type PaymentView = {
  id: string;
  provider: string;
  externalId: string;
  checkoutUrl: string | null;
  status: PaymentStatus;
  amount: number;
  expiresAt: string;
  paidAt: string | null;
  isCheckoutUsable: boolean;
};

export type OrderView = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  items: OrderItemView[];
  payments: PaymentView[];
  customerName?: string;
  customerEmail?: string;
};
