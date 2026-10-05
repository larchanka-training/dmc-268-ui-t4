import { z } from "zod";

import { isAppError } from "@/shared/lib/errors";
import { type HttpClient } from "@/shared/lib/http";
import { httpsUrlOrNull } from "@/shared/lib/url";

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
  // Null until one of the user's organisations installs the app.
  current_organization_id: z.string().min(1).nullable(),
});

type SessionDto = z.infer<typeof sessionDtoSchema>;

function toSession(dto: SessionDto): Session {
  return {
    user: {
      id: dto.user.id,
      login: dto.user.login,
      name: dto.user.name,
      avatarUrl: httpsUrlOrNull(dto.user.avatar_url),
      isPlatformAdmin: dto.user.is_platform_admin,
    },
    organizations: dto.organizations.map((org) => ({
      id: org.id,
      login: org.login,
      name: org.name,
      avatarUrl: httpsUrlOrNull(org.avatar_url),
      role: org.role,
    })),
    currentOrganizationId: dto.current_organization_id,
  };
}

export function createHttpSessionRepository(
  http: HttpClient,
  apiBaseUrl: string,
): SessionRepository {
  return {
    async getCurrentSession(signal): Promise<Session | null> {
      try {
        const dto = await http.get("/me", {
          schema: sessionDtoSchema,
          signal,
          // A 401 here is the answer "signed out", not a session lost mid-way.
          ignoreUnauthorized: true,
        });

        return toSession(dto);
      } catch (error) {
        if (isAppError(error) && error.kind === "unauthorized") {
          return null;
        }

        throw error;
      }
    },

    getSignInUrl(returnTo) {
      const start = `${apiBaseUrl}/auth/github`;

      return returnTo === null
        ? start
        : `${start}?return_to=${encodeURIComponent(returnTo)}`;
    },

    async signOut() {
      await http.post("/auth/logout", undefined, {
        schema: z.undefined(),
        ignoreUnauthorized: true,
      });
    },
  };
}
