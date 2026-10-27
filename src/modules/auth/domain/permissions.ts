import { type Session, currentOrganization } from "./session";

export type Action =
  | "runs:view"
  | "billing:view"
  | "billing:manage"
  | "repositories:connect"
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

  // Connecting leads to the app's install page, where GitHub asks which account to
  // install on. A member of an organisation can still pick their own account there.
  if (action === "repositories:connect") {
    return true;
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

/**
 * Whether the user may change which repositories an installation can access: on GitHub
 * only an owner of that account may. Per account rather than for the current one, since
 * the repository list holds every installation the user can see. A null account comes
 * from a backend that listed only the current organisation, so that one is checked.
 */
export function canManageRepositoriesOf(
  session: Session | null,
  organizationId: string | null,
): boolean {
  if (session === null) {
    return false;
  }

  const organization =
    organizationId === null
      ? currentOrganization(session)
      : session.organizations.find((item) => item.id === organizationId);

  return organization?.role === "owner";
}
