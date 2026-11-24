"use client";

import { CupSoda, Plus, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import type { MenuItem } from "@/features/menu/types/menu.types";

export function MenuCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd?: (item: MenuItem) => void;
}) {
  const Icon = item.category === "FOOD" ? UtensilsCrossed : CupSoda;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-emerald-50 via-zinc-50 to-amber-50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-amber-950/30">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon className="h-12 w-12 text-emerald-600/70" />
        )}
        <Badge variant="secondary" className="absolute left-3 top-3">
          {item.category === "FOOD" ? "Food" : "Drink"}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            {item.name}
          </h3>
          <span className="whitespace-nowrap text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {formatRupiah(item.price)}
          </span>
        </div>
        <p className="line-clamp-2 flex-1 text-sm text-zinc-500 dark:text-zinc-400">
          {item.description}
        </p>
        <Button
          type="button"
          size="sm"
          className="mt-2 w-full"
          onClick={() => onAdd?.(item)}
          disabled={!onAdd}
        >
          <Plus className="h-4 w-4" />
          Add to cart
        </Button>
      </div>
    </article>
  );
}
