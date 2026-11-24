"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { setMenuAvailabilityAction } from "@/features/menu/actions/set-menu-availability";
import { MenuFormDialog } from "@/features/menu/components/menu-form-dialog";
import type { MenuItem } from "@/features/menu/types/menu.types";
import { formatRupiah } from "@/lib/utils";

export function MenuAdmin({ items }: { items: MenuItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditing(item);
    setOpen(true);
  }

  async function toggleAvailability(item: MenuItem) {
    setPendingId(item.id);
    const result = await setMenuAvailabilityAction(item.id, !item.isAvailable);
    setPendingId(null);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Menu catalog</h2>
          <p className="text-sm text-zinc-500">
            {items.length} item{items.length === 1 ? "" : "s"} in the catalog.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No menu items yet"
          description="Create the first food or drink item for the catalog."
          action={<Button onClick={openCreate}>Add item</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => (
                <tr key={item.id} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </p>
                    <p className="line-clamp-1 text-xs text-zinc-500">
                      {item.description}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {item.category === "FOOD" ? "Food" : "Drink"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {formatRupiah(item.price)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.isAvailable ? "success" : "secondary"}>
                      {item.isAvailable ? "Available" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={item.isAvailable ? "destructive" : "secondary"}
                        disabled={pendingId === item.id}
                        onClick={() => toggleAvailability(item)}
                      >
                        {pendingId === item.id
                          ? "..."
                          : item.isAvailable
                            ? "Disable"
                            : "Enable"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setEditing(null);
          }
        }}
      >
        <MenuFormDialog
          key={editing?.id ?? "create"}
          menu={editing}
          onDone={() => setOpen(false)}
        />
      </Dialog>
    </div>
  );
}
