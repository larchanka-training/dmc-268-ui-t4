import { Link, Outlet } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { RepositoriesSidebar } from "@/modules/repositories";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

import { AccountMenu } from "./components/account-menu";
import { PrimaryNav } from "./components/primary-nav";
import { ThemeToggle } from "./components/theme-toggle";

/**
 * The frame of every console page: the sections and the account in the top bar, the
 * repositories in the sidebar. Below `md` both move into one drawer.
 */
export function ConsoleLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-dvh bg-surface text-content">
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-surface">
        <div className="flex h-full items-center gap-3 px-4">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-4" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>Review console</SheetTitle>
              <SheetDescription>
                Sections of the console and your connected repositories.
              </SheetDescription>
              <PrimaryNav
                label="Primary (menu)"
                orientation="vertical"
                onNavigate={closeDrawer}
              />
              <Separator />
              <RepositoriesSidebar onNavigate={closeDrawer} />
            </SheetContent>
          </Sheet>

          <Link to="/" className="text-sm font-semibold">
            Review console
          </Link>

          <PrimaryNav label="Primary" className="hidden md:flex" />

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          aria-label="Repositories"
          className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border p-3 md:block"
        >
          <RepositoriesSidebar />
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
