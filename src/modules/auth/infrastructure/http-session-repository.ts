import { z } from "zod";

import { isAppError } from "@/shared/lib/errors";
import { type HttpClient } from "@/shared/lib/http";

import { type SessionRepository } from "../application/ports";
import { type Session } from "../domain/session";

const sessionDtoSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    login: z.string().min(1),
    name: z.string(),
    avatar_url: z.url(),
    is_platform_admin: z.boolean(),
  }),
  organizations: z.array(
    z.object({
      id: z.string().min(1),
      login: z.string().min(1),
      name: z.string(),
      avatar_url: z.url(),
      role: z.enum(["member", "owner"]),
    }),
  ),
  current_organization_id: z.string().min(1),
});

export function createHttpSessionRepository(
  http: HttpClient,
  apiBaseUrl: string,
): SessionRepository {
  return {
    async getCurrentSession(signal): Promise<Session | null> {
      try {
        const dto = await http.get("/me", { schema: sessionDtoSchema, signal });

        return {
          user: {
            id: dto.user.id,
            login: dto.user.login,
            name: dto.user.name,
            avatarUrl: dto.user.avatar_url,
            isPlatformAdmin: dto.user.is_platform_admin,
          },
          organizations: dto.organizations.map((org) => ({
            id: org.id,
            login: org.login,
            name: org.name,
            avatarUrl: org.avatar_url,
            role: org.role,
          })),
          currentOrganizationId: dto.current_organization_id,
        };
      } catch (error) {
        // Being signed out is an expected answer, not a failure.
        if (isAppError(error) && error.kind === "unauthorized") {
          return null;
        }

        throw error;
      }
    },

    getSignInUrl(returnTo) {
      return `${apiBaseUrl}/auth/github?return_to=${encodeURIComponent(returnTo)}`;
    },
  };
}
