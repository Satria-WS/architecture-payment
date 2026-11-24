import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions/logout";
import { requireUser } from "@/lib/auth";

export async function DashboardNav() {
  const user = await requireUser();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight sm:inline">
              Warung Nusantara
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Menu</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/orders">My orders</Link>
            </Button>
            {user.role === "ADMIN" ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/orders">Kitchen</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/menu">Menu admin</Link>
                </Button>
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {user.name}
            </p>
            <p className="text-zinc-500">{user.role}</p>
          </div>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
