"use server";

import { revalidatePath, updateTag } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MENU_CACHE_TAG } from "@/features/menu/menu-cache";
import type { ActionResponse } from "@/types/action-response";

export async function setMenuAvailabilityAction(
  id: string,
  isAvailable: boolean
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Only admins can change availability." };
  }

  if (!id) {
    return { success: false, message: "Menu item id is required." };
  }

  await db.menuItem.update({
    where: { id },
    data: { isAvailable },
  });

  updateTag(MENU_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin/menu");

  return {
    success: true,
    message: isAvailable ? "Menu item enabled." : "Menu item disabled.",
  };
}
