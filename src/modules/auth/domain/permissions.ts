import { type Session, currentOrganization } from "./session";

export type Action =
  | "runs:view"
  | "billing:view"
  | "billing:manage"
  | "repositories:connect"
  | "repositories:disconnect"
  | "admin:view";

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

  // On GitHub only owners may change which repositories an installation can access.
  if (
    action === "billing:manage" ||
    action === "repositories:connect" ||
    action === "repositories:disconnect"
  ) {
    return organization.role === "owner";
  }

  return true;
}
