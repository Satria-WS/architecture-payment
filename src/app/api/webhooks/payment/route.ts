import { applyPaymentWebhook } from "@/features/orders/services/apply-payment-webhook";
import { getPaymentProvider } from "@/lib/payment/factory";
import { PaymentGatewayError } from "@/lib/payment/types";

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload;
  try {
    const provider = getPaymentProvider();
    payload = await provider.verifyAndParseWebhook(request.headers, rawBody);
  } catch (error) {
    if (error instanceof PaymentGatewayError) {
      const status = error.code === "INVALID_SIGNATURE" ? 401 : 400;
      return Response.json(
        { ok: false, message: error.message },
        { status }
      );
    }

    console.error("[payment-webhook] verification failed", error);
    return Response.json(
      { ok: false, message: "Webhook verification failed." },
      { status: 500 }
    );
  }

  try {
    const result = await applyPaymentWebhook(payload);

    if (!result.found) {
      return Response.json(
        { ok: false, message: "Payment transaction not found." },
        { status: 404 }
      );
    }

    if (result.amountMismatch) {
      return Response.json(
        { ok: false, message: "Webhook amount does not match the transaction." },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      duplicate: result.duplicate,
      orderId: result.orderId,
      orderStatus: result.orderStatus,
    });
  } catch (error) {
    console.error("[payment-webhook] processing failed", error);
    return Response.json(
      { ok: false, message: "Could not process payment webhook." },
      { status: 500 }
    );
  }
}
