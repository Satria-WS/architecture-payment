"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { retryPaymentAction } from "@/features/orders/actions/retry-payment";

export function PayNowButton({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const result = await retryPaymentAction({ orderId });
      if (!result.success || !result.data?.checkoutUrl) {
        toast.error(result.message);
        return;
      }

      window.location.assign(result.data.checkoutUrl);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="sm" onClick={handleClick} disabled={pending}>
      <CreditCard className="h-4 w-4" />
      {pending ? "Preparing..." : "Pay now"}
    </Button>
  );
}
