import { z } from "zod";

/**
 * Environment is validated once, at startup: a typo in a .env file becomes a clear error
 * instead of a blank screen. Nothing else may read import.meta.env directly.
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default("/api"),
  VITE_ENABLE_MOCKS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${z.prettifyError(parsed.error)}`,
  );
}

export const env = {
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  enableMocks: parsed.data.VITE_ENABLE_MOCKS,
} as const;
