import "server-only";

import { db } from "@/lib/db";
import type { MenuCategory, MenuItem } from "@/features/menu/types/menu.types";

export async function getMenuById(id: string): Promise<MenuItem | null> {
  const item = await db.menuItem.findUnique({ where: { id } });
  if (!item) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category as MenuCategory,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
  };
}
