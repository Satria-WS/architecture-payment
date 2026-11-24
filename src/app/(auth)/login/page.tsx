import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in | Warung Nusantara",
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to place orders and track your kitchen status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <LoginForm />
        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-900">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">
            Demo accounts
          </p>
          <p>Customer: customer@fnb.local / Customer12345</p>
          <p>Admin: admin@fnb.local / Admin12345</p>
        </div>
      </CardContent>
    </Card>
  );
}
