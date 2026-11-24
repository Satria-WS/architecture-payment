"use client";

import { Button } from "@/components/ui/button";

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
      <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
        Could not load your orders
      </h2>
      <p className="mt-1 text-sm text-red-700 dark:text-red-400">
        {error.message || "Something went wrong."}
      </p>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
