"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMenuAction } from "@/features/menu/actions/create-menu";
import { updateMenuAction } from "@/features/menu/actions/update-menu";
import type { MenuItem } from "@/features/menu/types/menu.types";
import type { ActionResponse } from "@/types/action-response";

export function MenuFormDialog({
  menu,
  onDone,
}: {
  menu?: MenuItem | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const action = menu ? updateMenuAction : createMenuAction;
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.success) {
      toast.success(state.message);
      onDone();
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, onDone, router]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{menu ? "Edit menu item" : "New menu item"}</DialogTitle>
        <DialogDescription>
          {menu
            ? "Update the details customers see in the catalog."
            : "Add a new food or drink to the catalog."}
        </DialogDescription>
      </DialogHeader>

      <form action={formAction} className="space-y-4">
        {menu ? <input type="hidden" name="id" value={menu.id} /> : null}

        <div className="space-y-2">
          <Label htmlFor="menu-name">Name</Label>
          <Input
            id="menu-name"
            name="name"
            defaultValue={menu?.name ?? ""}
            required
          />
          {state?.errors?.name?.map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="menu-description">Description</Label>
          <Textarea
            id="menu-description"
            name="description"
            defaultValue={menu?.description ?? ""}
            required
          />
          {state?.errors?.description?.map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="menu-price">Price (IDR)</Label>
            <Input
              id="menu-price"
              name="price"
              type="number"
              min={1000}
              step={500}
              defaultValue={menu?.price ?? ""}
              required
            />
            {state?.errors?.price?.map((message) => (
              <p key={message} className="text-xs text-red-600">
                {message}
              </p>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="menu-category">Category</Label>
            <select
              id="menu-category"
              name="category"
              defaultValue={menu?.category ?? "FOOD"}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="FOOD">Food</option>
              <option value="DRINK">Drink</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="menu-image">Image URL (optional)</Label>
          <Input
            id="menu-image"
            name="imageUrl"
            type="url"
            defaultValue={menu?.imageUrl ?? ""}
            placeholder="https://..."
          />
          {state?.errors?.imageUrl?.map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : menu ? "Save changes" : "Create item"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
