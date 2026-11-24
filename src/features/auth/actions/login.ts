"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { toFieldErrors } from "@/lib/validation";
import { loginSchema } from "@/features/auth/schemas/auth-schema";
import type { ActionResponse } from "@/types/action-response";

function authErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "body" in error) {
    const body = (error as { body?: { message?: string } }).body;
    if (body?.message) {
      return body.message;
    }
  }

  return error instanceof Error ? error.message : "Authentication failed.";
}

export async function loginAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your credentials.",
      errors: toFieldErrors(parsed.error),
    };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
  } catch (error) {
    return {
      success: false,
      message: authErrorMessage(error),
    };
  }

  redirect("/orders");
}
