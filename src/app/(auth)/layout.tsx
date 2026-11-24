import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-zinc-50 to-amber-50 px-4 py-12 dark:from-emerald-950/30 dark:via-zinc-950 dark:to-amber-950/20">
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight">
        Warung Nusantara
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
