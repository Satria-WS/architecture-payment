import { Card, CardContent } from "@/components/ui/card";

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      {[0, 1].map((index) => (
        <Card key={index}>
          <CardContent className="space-y-3 p-6">
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
