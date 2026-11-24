import { z } from "zod";

export const menuSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name is too long."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(500, "Description is too long."),
  price: z.coerce
    .number()
    .int("Price must be a whole number.")
    .min(1000, "Minimum price is Rp 1.000.")
    .max(10_000_000, "Maximum price is Rp 10.000.000."),
  category: z.enum(["FOOD", "DRINK"]),
  imageUrl: z
    .union([z.url("Enter a valid image URL."), z.literal("")])
    .optional(),
});

export type MenuFormInput = z.infer<typeof menuSchema>;
