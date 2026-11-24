import { Clock, ShieldCheck, Utensils } from "lucide-react";

import { CatalogClient } from "@/app/(public)/_components/catalog-client";
import { Badge } from "@/components/ui/badge";
import { getMenus } from "@/features/menu/queries/get-menus";

export default async function HomePage() {
  const items = await getMenus();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="mb-10 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-8 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-amber-950/20 sm:p-12">
        <Badge variant="outline" className="mb-4 bg-white/60 dark:bg-zinc-900/60">
          Fresh from the kitchen
        </Badge>
        <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
          Indonesian comfort food,
          <span className="text-emerald-700 dark:text-emerald-400">
            {" "}
            paid your way.
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-300">
          Order food and drinks, then complete payment through a pluggable
          gateway. This demo runs on a local Dummy provider by default.
        </p>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-300">
          <span className="flex items-center gap-2">
            <Utensils className="h-4 w-4 text-emerald-600" />
            {items.length} menu items
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            Track kitchen status
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Server-verified prices
          </span>
        </div>
      </section>

      <CatalogClient items={items} />
    </div>
  );
}
