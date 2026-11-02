import { UserAvatar, useSession } from "@/modules/auth";
import { Badge } from "@/shared/ui/badge";

import { type RepositoryGroup } from "../../domain/repository";

import { RepositoryRow } from "./repository-row";

/**
 * One account's repositories, under a heading that names the account. The heading is left
 * out when the backend did not say which account a repository came through.
 */
export function AccountRepositories({ group }: { group: RepositoryGroup }) {
  const session = useSession();
  const organization =
    session.data?.organizations.find(
      (item) => item.id === group.organizationId,
    ) ?? null;
  const isPersonal =
    organization !== null && organization.login === session.data?.user.login;
  const headingId = `account-${group.organizationId ?? "unknown"}`;

  return (
    <section aria-labelledby={organization === null ? undefined : headingId}>
      {organization === null ? null : (
        <h2
          id={headingId}
          className="mb-2 flex items-center gap-2 text-sm font-medium"
        >
          <UserAvatar
            url={organization.avatarUrl}
            name={organization.name}
            className="size-5"
          />
          {organization.name}
          <span className="text-content-muted">{`@${organization.login}`}</span>
          <Badge variant="secondary">
            {isPersonal ? "Personal" : "Organisation"}
          </Badge>
        </h2>
      )}
      <ul className="overflow-hidden rounded-md border border-border bg-surface">
        {group.repositories.map((repository) => (
          <RepositoryRow key={repository.id} repository={repository} />
        ))}
      </ul>
    </section>
  );
}
