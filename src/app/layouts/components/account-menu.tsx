import { ChevronDown, LogOut } from "lucide-react";

import {
  UserAvatar,
  currentOrganization,
  useSession,
  useSignOut,
} from "@/modules/auth";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Skeleton } from "@/shared/ui/skeleton";

const ROLE_LABELS = { owner: "Owner", member: "Member" } as const;

/** Who is signed in, for which organisation, and the way out. */
export function AccountMenu() {
  const session = useSession();
  const signOut = useSignOut();

  if (!session.data) {
    return <Skeleton className="h-8 w-28" />;
  }

  const { user } = session.data;
  const organization = currentOrganization(session.data);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <UserAvatar
            url={user.avatarUrl}
            name={user.name}
            className="size-6"
          />
          <span className="hidden sm:inline">{`@${user.login}`}</span>
          {organization === null ? null : (
            <span className="hidden text-content-muted lg:inline">
              {organization.name}
            </span>
          )}
          <ChevronDown className="size-3" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col font-normal">
          <span className="text-xs text-content-muted">Signed in as</span>
          <span className="font-medium">{user.name}</span>
          <span className="text-xs text-content-muted">{`@${user.login}`}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-content-muted">
          {organization === null
            ? "No organisation has installed the app yet"
            : `${organization.name} · ${ROLE_LABELS[organization.role]}`}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          onSelect={() => {
            signOut.mutate();
          }}
        >
          <LogOut className="size-4" aria-hidden />
          {signOut.isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
