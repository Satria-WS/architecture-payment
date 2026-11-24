import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db";
import { MENU_CACHE_TAG } from "@/features/menu/menu-cache";
import type { MenuCategory, MenuItem } from "@/features/menu/types/menu.types";

export async function getMenus(): Promise<MenuItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(MENU_CACHE_TAG);

  const items = await db.menuItem.findMany({
    where: { isAvailable: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const categoryOrder: Record<MenuCategory, number> = {
    FOOD: 0,
    DRINK: 1,
  };

  return items
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category as MenuCategory,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
    }))
    .sort(
      (a, b) =>
        categoryOrder[a.category] - categoryOrder[b.category] ||
        a.name.localeCompare(b.name)
    );
}
