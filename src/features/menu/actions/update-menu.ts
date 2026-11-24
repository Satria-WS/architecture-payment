"use server";

import { revalidatePath, updateTag } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toFieldErrors } from "@/lib/validation";
import { MENU_CACHE_TAG } from "@/features/menu/menu-cache";
import { menuSchema } from "@/features/menu/schemas/menu-schema";
import type { ActionResponse } from "@/types/action-response";

export async function updateMenuAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Only admins can update menu items." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { success: false, message: "Menu item id is required." };
  }

  const parsed = menuSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category"),
    imageUrl: formData.get("imageUrl") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please review the menu item.",
      errors: toFieldErrors(parsed.error),
    };
  }

  await db.menuItem.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      category: parsed.data.category,
      imageUrl: parsed.data.imageUrl || null,
    },
  });

  updateTag(MENU_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin/menu");

  return { success: true, message: "Menu item updated." };
}
