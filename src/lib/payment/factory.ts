import "server-only";

import { DummyPaymentProvider } from "@/lib/payment/providers/dummy-provider";
import { XenditPaymentProvider } from "@/lib/payment/providers/xendit-provider";
import type {
  PaymentGatewayProvider,
  PaymentProviderName,
} from "@/lib/payment/types";

let cachedProvider: PaymentGatewayProvider | null = null;

function resolveProviderName(): PaymentProviderName {
  const configured = (process.env.PAYMENT_PROVIDER ?? "dummy").toUpperCase();

  if (configured === "DUMMY") {
    return "DUMMY";
  }

  if (configured === "XENDIT") {
    return "XENDIT";
  }

  throw new Error(
    `Unsupported PAYMENT_PROVIDER "${configured}". Use "dummy" or "xendit".`
  );
}

export function getPaymentProvider(): PaymentGatewayProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerName = resolveProviderName();

  cachedProvider =
    providerName === "XENDIT"
      ? new XenditPaymentProvider()
      : new DummyPaymentProvider();

  return cachedProvider;
}
