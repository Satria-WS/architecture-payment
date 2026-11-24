import { Suspense } from "react";

import { DashboardNav } from "@/components/shared/dashboard-nav";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Suspense
        fallback={<div className="h-16 border-b border-zinc-200 dark:border-zinc-800" />}
      >
        <DashboardNav />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
