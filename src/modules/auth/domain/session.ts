/** Who is signed in, and what they may do. Roles inside an organisation come from GitHub. */

export type OrganizationRole = "member" | "owner";

export interface User {
  readonly id: string;
  readonly login: string;
  readonly name: string;
  /** Only an https URL is kept; null means "show initials instead". */
  readonly avatarUrl: string | null;
  /** Set for our own staff; grants access to the admin area. */
  readonly isPlatformAdmin: boolean;
}

export interface Organization {
  readonly id: string;
  readonly login: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly role: OrganizationRole;
}

export interface Session {
  readonly user: User;
  readonly organizations: readonly Organization[];
  /**
   * The organisation the console is currently showing; null when none of the user's
   * organisations has installed the app yet.
   */
  readonly currentOrganizationId: string | null;
}

export function currentOrganization(session: Session): Organization | null {
  if (session.currentOrganizationId === null) {
    return null;
  }

  return (
    session.organizations.find(
      (org) => org.id === session.currentOrganizationId,
    ) ?? null
  );
}
