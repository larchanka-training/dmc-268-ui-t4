import { Link, Outlet } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";

import { can, currentOrganization, useSession } from "@/modules/auth";
import { Button } from "@/shared/ui/button";

import { useThemeStore } from "../providers/theme";

export function ConsoleLayout() {
  const session = useSession();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  const organization = session.data ? currentOrganization(session.data) : null;

  return (
    <div className="min-h-dvh bg-surface text-content">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="text-sm font-semibold">Review console</span>

          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/runs" activeProps={{ className: "bg-surface-muted" }}>
                Runs
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link
                to="/billing"
                activeProps={{ className: "bg-surface-muted" }}
              >
                Billing
              </Link>
            </Button>
            {can(session.data ?? null, "admin:view") ? (
              <Button asChild variant="ghost" size="sm">
                <Link
                  to="/admin/subscriptions"
                  activeProps={{ className: "bg-surface-muted" }}
                >
                  Admin
                </Link>
              </Button>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm text-content-muted">
            {organization === null ? null : <span>{organization.login}</span>}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Toggle theme"
              onClick={() => {
                setPreference(preference === "dark" ? "light" : "dark");
              }}
            >
              {preference === "dark" ? (
                <Sun className="size-4" aria-hidden />
              ) : (
                <Moon className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
