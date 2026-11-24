import "server-only";

import Xendit from "xendit-node";

import { safeCompare } from "@/lib/payment/signature";
import {
  PaymentGatewayError,
  type CreateInvoiceInput,
  type CreateInvoiceResult,
  type NormalizedPaymentStatus,
  type NormalizedWebhookPayload,
  type PaymentGatewayProvider,
} from "@/lib/payment/types";

type XenditWebhookBody = {
  id?: string;
  external_id?: string;
  status?: string;
  paid_amount?: number;
  amount?: number;
  payment_method?: string | { type?: string };
  paid_at?: string;
};

function mapXenditStatus(status: string | undefined): NormalizedPaymentStatus {
  switch (status?.toUpperCase()) {
    case "PAID":
    case "SETTLED":
      return "PAID";
    case "EXPIRED":
      return "EXPIRED";
    case "FAILED":
      return "FAILED";
    default:
      return "PENDING";
  }
}

class XenditPaymentProvider implements PaymentGatewayProvider {
  readonly name = "XENDIT" as const;

  private client: Xendit | null = null;

  private getClient() {
    const secretKey = process.env.XENDIT_SECRET_KEY;
    if (!secretKey) {
      throw new PaymentGatewayError(
        "XENDIT_SECRET_KEY is not configured.",
        "NOT_CONFIGURED"
      );
    }

    if (!this.client) {
      this.client = new Xendit({ secretKey });
    }

    return this.client;
  }

  async createInvoice(
    input: CreateInvoiceInput
  ): Promise<CreateInvoiceResult> {
    const client = this.getClient();
    const invoiceDuration = Math.max(
      60,
      Math.floor((input.expiresAt.getTime() - Date.now()) / 1000)
    );

    try {
      const invoice = await client.Invoice.createInvoice({
        data: {
          externalId: input.externalId,
          amount: input.amount,
          payerEmail: input.customer.email,
          description: input.description,
          invoiceDuration,
          shouldSendEmail: false,
          successRedirectUrl: input.successRedirectUrl,
          failureRedirectUrl: input.failureRedirectUrl,
        },
      });

      return {
        provider: this.name,
        externalId: invoice.externalId ?? input.externalId,
        checkoutUrl: invoice.invoiceUrl,
        expiresAt: invoice.expiryDate ?? input.expiresAt,
        raw: invoice,
      };
    } catch (error) {
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : "Xendit invoice creation failed.",
        "PROVIDER_ERROR"
      );
    }
  }

  async verifyAndParseWebhook(
    headers: Headers,
    rawBody: string
  ): Promise<NormalizedWebhookPayload> {
    const configuredToken = process.env.XENDIT_WEBHOOK_TOKEN;
    if (!configuredToken) {
      throw new PaymentGatewayError(
        "XENDIT_WEBHOOK_TOKEN is not configured.",
        "NOT_CONFIGURED"
      );
    }

    const callbackToken = headers.get("x-callback-token") ?? "";
    if (!callbackToken || !safeCompare(callbackToken, configuredToken)) {
      throw new PaymentGatewayError(
        "Invalid Xendit callback token.",
        "INVALID_SIGNATURE"
      );
    }

    let body: XenditWebhookBody;
    try {
      body = JSON.parse(rawBody) as XenditWebhookBody;
    } catch {
      throw new PaymentGatewayError("Malformed webhook body.", "INVALID_PAYLOAD");
    }

    if (!body.external_id) {
      throw new PaymentGatewayError(
        "Webhook body is missing external_id.",
        "INVALID_PAYLOAD"
      );
    }

    const amount = body.paid_amount ?? body.amount;
    if (typeof amount !== "number" || amount <= 0) {
      throw new PaymentGatewayError(
        "Webhook body is missing a valid amount.",
        "INVALID_PAYLOAD"
      );
    }

    const rawPaymentMethod =
      typeof body.payment_method === "string"
        ? body.payment_method
        : body.payment_method?.type;

    return {
      externalId: body.external_id,
      status: mapXenditStatus(body.status),
      amount,
      providerTransactionId: body.id,
      paymentMethod: rawPaymentMethod,
      paidAt: body.paid_at ? new Date(body.paid_at) : undefined,
      raw: body,
    };
  }
}

export { XenditPaymentProvider };
