/** Who is signed in, and what they may do. Roles inside an organisation come from GitHub. */

export type OrganizationRole = "member" | "owner";

export interface User {
  readonly id: string;
  readonly login: string;
  readonly name: string;
  readonly avatarUrl: string;
  /** Set for our own staff; grants access to the admin area. */
  readonly isPlatformAdmin: boolean;
}

export interface Organization {
  readonly id: string;
  readonly login: string;
  readonly name: string;
  readonly avatarUrl: string;
  readonly role: OrganizationRole;
}

export interface Session {
  readonly user: User;
  readonly organizations: readonly Organization[];
  /** The organisation the console is currently showing. */
  readonly currentOrganizationId: string;
}

export function currentOrganization(session: Session): Organization | null {
  return (
    session.organizations.find(
      (org) => org.id === session.currentOrganizationId,
    ) ?? null
  );
}
