import "server-only";

import {
  createDummyToken,
  verifyDummyToken,
} from "@/lib/payment/signature";
import {
  PaymentGatewayError,
  type CreateInvoiceInput,
  type CreateInvoiceResult,
  type NormalizedPaymentStatus,
  type NormalizedWebhookPayload,
  type PaymentGatewayProvider,
} from "@/lib/payment/types";

const ALLOWED_STATUSES: NormalizedPaymentStatus[] = [
  "PAID",
  "EXPIRED",
  "FAILED",
];

type DummyWebhookBody = {
  externalId?: string;
  status?: string;
  amount?: number;
  paymentMethod?: string;
};

class DummyPaymentProvider implements PaymentGatewayProvider {
  readonly name = "DUMMY" as const;

  async createInvoice(
    input: CreateInvoiceInput
  ): Promise<CreateInvoiceResult> {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const token = createDummyToken(input.externalId);
    const checkoutUrl = `${appUrl}/checkout/dummy/${encodeURIComponent(
      input.externalId
    )}?token=${token}`;

    return {
      provider: this.name,
      externalId: input.externalId,
      checkoutUrl,
      expiresAt: input.expiresAt,
    };
  }

  async verifyAndParseWebhook(
    headers: Headers,
    rawBody: string
  ): Promise<NormalizedWebhookPayload> {
    const token =
      headers.get("x-dummy-token") ??
      headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      "";

    let body: DummyWebhookBody;
    try {
      body = JSON.parse(rawBody) as DummyWebhookBody;
    } catch {
      throw new PaymentGatewayError("Malformed webhook body.", "INVALID_PAYLOAD");
    }

    if (!body.externalId || !body.status) {
      throw new PaymentGatewayError(
        "Webhook body must include externalId and status.",
        "INVALID_PAYLOAD"
      );
    }

    if (!token || !verifyDummyToken(body.externalId, token)) {
      throw new PaymentGatewayError(
        "Invalid dummy webhook signature.",
        "INVALID_SIGNATURE"
      );
    }

    const status = body.status.toUpperCase() as NormalizedPaymentStatus;
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new PaymentGatewayError(
        `Unsupported dummy payment status: ${body.status}`,
        "INVALID_PAYLOAD"
      );
    }

    if (typeof body.amount !== "number" || body.amount <= 0) {
      throw new PaymentGatewayError(
        "Webhook body must include a valid amount.",
        "INVALID_PAYLOAD"
      );
    }

    return {
      externalId: body.externalId,
      status,
      amount: body.amount,
      providerTransactionId: `dummy_${body.externalId}`,
      paymentMethod: body.paymentMethod ?? "DUMMY",
      paidAt: status === "PAID" ? new Date() : undefined,
      raw: body,
    };
  }
}

export { DummyPaymentProvider };
