export type MenuCategory = "FOOD" | "DRINK";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl: string | null;
  isAvailable: boolean;
};

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  FOOD: "Food",
  DRINK: "Drinks",
};
