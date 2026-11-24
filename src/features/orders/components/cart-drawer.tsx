"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createOrderAction } from "@/features/orders/actions/create-order";
import { useCart } from "@/features/orders/hooks/use-cart";
import { formatRupiah } from "@/lib/utils";

export function CartDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const {
    items,
    itemCount,
    subtotal,
    increment,
    decrement,
    removeItem,
    clear,
    notes,
    setNotes,
  } = useCart();

  async function checkout() {
    setPending(true);
    try {
      const result = await createOrderAction({
        items: items.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
        })),
        notes: notes.trim() || undefined,
      });

      if (!result.success || !result.data?.checkoutUrl) {
        toast.error(result.message);

        if (result.errors?.auth) {
          router.push("/login?next=/");
        }
        return;
      }

      clear();
      setOpen(false);
      window.location.assign(result.data.checkoutUrl);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 rounded-full px-5 shadow-lg"
        aria-label="Open cart"
      >
        <ShoppingBag className="h-5 w-5" />
        Cart
        {itemCount > 0 ? (
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
            {itemCount}
          </span>
        ) : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-auto right-0 top-0 flex h-full max-h-none w-full max-w-md translate-x-0 translate-y-0 flex-col rounded-none border-l p-6">
          <DialogHeader>
            <DialogTitle>Your cart</DialogTitle>
            <DialogDescription>
              {itemCount} item{itemCount === 1 ? "" : "s"} ready for checkout.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto py-2">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
                Your cart is empty. Add something delicious from the menu.
              </div>
            ) : (
              items.map((line) => (
                <div
                  key={line.menuItemId}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {line.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatRupiah(line.price)} each
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => decrement(line.menuItemId)}
                        aria-label={`Decrease ${line.name}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => increment(line.menuItemId)}
                        aria-label={`Increase ${line.name}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-semibold">
                      {formatRupiah(line.price * line.quantity)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-600"
                      onClick={() => removeItem(line.menuItemId)}
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            {items.length > 0 ? (
              <div className="space-y-2">
                <label
                  htmlFor="cart-notes"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Order notes
                </label>
                <Textarea
                  id="cart-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Less spicy, no onions, etc."
                  maxLength={500}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span className="text-lg font-bold">{formatRupiah(subtotal)}</span>
            </div>

            <Button
              className="w-full"
              disabled={items.length === 0 || pending}
              onClick={checkout}
            >
              {pending ? "Creating payment..." : "Checkout"}
            </Button>
            <p className="text-center text-xs text-zinc-400">
              Already signed in? You will go straight to payment. Otherwise you
              will be asked to sign in.
            </p>
            <p className="text-center text-xs text-zinc-400">
              <Link href="/login" className="underline">
                Sign in
              </Link>{" "}
              to keep your order history.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
