"use client";

import { MenuCatalog } from "@/features/menu/components/menu-catalog";
import type { MenuItem } from "@/features/menu/types/menu.types";
import { useCart } from "@/features/orders/hooks/use-cart";

export function CatalogClient({ items }: { items: MenuItem[] }) {
  const { addItem } = useCart();

  return (
    <MenuCatalog
      items={items}
      onAdd={(item) =>
        addItem({
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          imageUrl: item.imageUrl,
        })
      }
    />
  );
}
