import { z } from "zod";

/** The demo build is the mocked console by definition; an explicit VITE_ENABLE_MOCKS wins. */
const MOCKS_BY_DEFAULT = import.meta.env.MODE === "demo" ? "true" : "false";

/**
 * Environment is validated once, at startup: a typo in a .env file becomes a clear error
 * instead of a blank screen. Nothing else may read import.meta.env directly.
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default("/api"),
  VITE_ENABLE_MOCKS: z
    .enum(["true", "false"])
    .default(MOCKS_BY_DEFAULT)
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
