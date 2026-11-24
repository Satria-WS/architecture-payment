"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DummyCheckoutView } from "@/features/payments/queries/get-payment-by-external-id";
import { formatRupiah } from "@/lib/utils";

export function DummyCheckoutSimulator({
  payment,
  token,
}: {
  payment: DummyCheckoutView;
  token: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const isPaid = payment.paymentStatus === "PAID";
  const isExpired = payment.paymentStatus === "EXPIRED";

  async function sendEvent(status: "PAID" | "EXPIRED") {
    setPending(status);

    try {
      const response = await fetch("/api/webhooks/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dummy-token": token,
        },
        body: JSON.stringify({
          externalId: payment.externalId,
          status,
          amount: payment.amount,
          paymentMethod: "DUMMY",
        }),
      });

      const body = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !body.ok) {
        toast.error(body.message ?? "Payment simulation failed.");
        return;
      }

      if (status === "PAID") {
        toast.success("Payment received. Order confirmed!");
        router.push("/orders");
      } else {
        toast.success("Invoice expired.");
        router.refresh();
      }
    } catch {
      toast.error("Could not reach the payment webhook.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 py-10">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          DummyPay
        </p>
        <h1 className="mt-2 text-2xl font-bold">Hosted invoice simulator</h1>
        <p className="mt-1 text-sm text-zinc-500">
          This page mimics a payment provider invoice. No real money moves.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-base">
              {payment.orderNumber}
            </CardTitle>
            {isPaid ? (
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Paid
              </span>
            ) : isExpired ? (
              <span className="flex items-center gap-1 text-sm font-medium text-red-600">
                <XCircle className="h-4 w-4" /> Expired
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-medium text-amber-600">
                <Clock className="h-4 w-4" /> Awaiting payment
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            {payment.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="text-zinc-500">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <span className="text-sm text-zinc-500">Amount due</span>
            <span className="text-xl font-bold">{formatRupiah(payment.amount)}</span>
          </div>

          <div className="grid gap-2">
            <Button
              disabled={isPaid || pending !== null}
              onClick={() => sendEvent("PAID")}
            >
              {pending === "PAID" ? "Processing..." : "Pay now"}
            </Button>
            <Button
              variant="outline"
              disabled={isPaid || isExpired || pending !== null}
              onClick={() => sendEvent("EXPIRED")}
            >
              {pending === "EXPIRED" ? "Expiring..." : "Expire invoice"}
            </Button>
          </div>

          <p className="text-center text-xs text-zinc-400">
            Simulates a signed provider callback to{" "}
            <code>/api/webhooks/payment</code>.
          </p>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/orders">Back to orders</Link>
        </Button>
      </div>
    </div>
  );
}
