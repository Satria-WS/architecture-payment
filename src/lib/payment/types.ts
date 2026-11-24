export type PaymentProviderName = "DUMMY" | "XENDIT";

export type NormalizedPaymentStatus =
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "FAILED";

export type CreateInvoiceInput = {
  externalId: string;
  orderNumber: string;
  amount: number;
  description: string;
  customer: {
    name: string;
    email: string;
  };
  successRedirectUrl: string;
  failureRedirectUrl: string;
  expiresAt: Date;
  metadata?: Record<string, string>;
};

export type CreateInvoiceResult = {
  provider: PaymentProviderName;
  externalId: string;
  checkoutUrl: string;
  expiresAt: Date;
  raw?: unknown;
};

export type NormalizedWebhookPayload = {
  externalId: string;
  status: NormalizedPaymentStatus;
  amount: number;
  providerTransactionId?: string;
  paymentMethod?: string;
  paidAt?: Date;
  raw: unknown;
};

export interface PaymentGatewayProvider {
  readonly name: PaymentProviderName;
  createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult>;
  verifyAndParseWebhook(
    headers: Headers,
    rawBody: string
  ): Promise<NormalizedWebhookPayload>;
}

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_SIGNATURE"
      | "INVALID_PAYLOAD"
      | "NOT_CONFIGURED"
      | "PROVIDER_ERROR" = "PROVIDER_ERROR"
  ) {
    super(message);
    this.name = "PaymentGatewayError";
  }
}
