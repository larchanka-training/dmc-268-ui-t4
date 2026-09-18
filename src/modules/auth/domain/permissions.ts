import { type Session, currentOrganization } from "./session";

export type Action =
  "runs:view" | "billing:view" | "billing:manage" | "admin:view";

/**
 * Permission checks used to hide UI a user cannot act on. The backend enforces the same
 * rules; this is about not showing dead ends, not about security.
 */
export function can(session: Session | null, action: Action): boolean {
  if (session === null) {
    return false;
  }

  if (action === "admin:view") {
    return session.user.isPlatformAdmin;
  }

  const organization = currentOrganization(session);

  if (organization === null) {
    return false;
  }

  if (action === "billing:manage") {
    return organization.role === "owner";
  }

  return true;
}
