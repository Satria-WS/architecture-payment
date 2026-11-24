import { Suspense } from "react";

import { PublicNav } from "@/components/shared/public-nav";
import { CartDrawer } from "@/features/orders/components/cart-drawer";
import { CartProvider } from "@/features/orders/hooks/use-cart";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <Suspense
        fallback={<div className="h-16 border-b border-zinc-200 dark:border-zinc-800" />}
      >
        <PublicNav />
      </Suspense>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">{children}</div>
      <CartDrawer />
    </CartProvider>
  );
}
