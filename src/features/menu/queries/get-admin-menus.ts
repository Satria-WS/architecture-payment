import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { MenuCategory, MenuItem } from "@/features/menu/types/menu.types";

export async function getAdminMenus(): Promise<MenuItem[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return [];
  }

  const items = await db.menuItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category as MenuCategory,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
  }));
}
