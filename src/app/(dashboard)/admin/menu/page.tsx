import { Suspense } from "react";

import { MenuAdmin } from "@/features/menu/components/menu-admin";
import { getAdminMenus } from "@/features/menu/queries/get-admin-menus";

export default function AdminMenuPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Menu management</h1>
        <p className="text-sm text-zinc-500">
          Create, edit, and disable food or drink items.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        }
      >
        <AdminMenuContent />
      </Suspense>
    </div>
  );
}

async function AdminMenuContent() {
  const items = await getAdminMenus();
  return <MenuAdmin items={items} />;
}
