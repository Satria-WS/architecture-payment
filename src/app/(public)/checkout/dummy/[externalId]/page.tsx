import { Suspense } from "react";
import { notFound } from "next/navigation";

import { DummyCheckoutSimulator } from "@/features/payments/components/dummy-checkout-simulator";
import { getPaymentByExternalId } from "@/features/payments/queries/get-payment-by-external-id";

type PageProps = {
  params: Promise<{ externalId: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export default function DummyCheckoutPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-lg py-16 text-center text-sm text-zinc-500">
          Loading invoice...
        </div>
      }
    >
      <DummyCheckoutContent {...props} />
    </Suspense>
  );
}

async function DummyCheckoutContent({ params, searchParams }: PageProps) {
  const { externalId } = await params;
  const { token } = await searchParams;
  const resolvedToken = typeof token === "string" ? token : undefined;
  const payment = await getPaymentByExternalId(externalId, resolvedToken);

  if (!payment || !resolvedToken) {
    notFound();
  }

  return <DummyCheckoutSimulator payment={payment} token={resolvedToken} />;
}
