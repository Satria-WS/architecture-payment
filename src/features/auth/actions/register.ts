"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { toFieldErrors } from "@/lib/validation";
import { registerSchema } from "@/features/auth/schemas/auth-schema";
import type { ActionResponse } from "@/types/action-response";

function authErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "body" in error) {
    const body = (error as { body?: { message?: string } }).body;
    if (body?.message) {
      return body.message;
    }
  }

  return error instanceof Error ? error.message : "Registration failed.";
}

export async function registerAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please review the form.",
      errors: toFieldErrors(parsed.error),
    };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
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
