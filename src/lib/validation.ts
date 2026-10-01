import { z } from "zod";
import { isDateKey } from "./dates";

/** Devuelve { campo: mensaje } con el primer error de cada campo. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const emailSchema = z.string().trim().min(1, "Ingresá tu email.").email("El email no es válido.");
export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña es demasiado larga.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, "¿Cómo te llamás?").max(60, "Máximo 60 caracteres."),
  email: emailSchema,
  password: passwordSchema,
});

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Las contraseñas no coinciden.", path: ["confirm"] });

export const activitySchema = z.object({
  title: z.string().trim().min(1, "Poné un título.").max(120, "Máximo 120 caracteres."),
  notes: z.string().max(2000, "Máximo 2000 caracteres.").optional(),
  date: z.string().refine(isDateKey, "Elegí una fecha válida."),
  durationSeconds: z.number().int().min(0).max(86400, "La duración máxima es 24 horas."),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida.")
    .optional()
    .or(z.literal("")),
});

export const sectionSchema = z.object({
  name: z.string().trim().min(1, "Poné un nombre.").max(40, "Máximo 40 caracteres."),
  description: z.string().trim().max(200, "Máximo 200 caracteres.").optional(),
});

export const goalMinutesSchema = z
  .number()
  .int()
  .min(1, "El objetivo debe ser de al menos 1 minuto.")
  .max(44640, "El objetivo es demasiado grande.");
