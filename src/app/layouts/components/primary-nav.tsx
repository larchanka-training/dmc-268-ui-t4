import { Link } from "@tanstack/react-router";

import { can, useSession } from "@/modules/auth";

const NAV_LINK =
  "rounded-md px-3 py-1.5 text-sm text-content-muted hover:bg-surface-muted hover:text-content";
const NAV_LINK_ACTIVE = { className: "bg-surface-muted text-content" };

/** The console's sections. Admin appears only for platform admins. */
export function PrimaryNav({
  label,
  orientation = "horizontal",
  className,
  onNavigate,
}: {
  label: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
  onNavigate?: () => void;
}) {
  const session = useSession();
  const layout = orientation === "vertical" ? "flex-col" : "items-center";

  return (
    <nav
      aria-label={label}
      className={["flex gap-1", layout, className].filter(Boolean).join(" ")}
    >
      <Link
        to="/"
        activeOptions={{ exact: true }}
        activeProps={NAV_LINK_ACTIVE}
        className={NAV_LINK}
        onClick={onNavigate}
      >
        Overview
      </Link>
      <Link
        to="/runs"
        activeProps={NAV_LINK_ACTIVE}
        className={NAV_LINK}
        onClick={onNavigate}
      >
        Runs
      </Link>
      <Link
        to="/billing"
        activeProps={NAV_LINK_ACTIVE}
        className={NAV_LINK}
        onClick={onNavigate}
      >
        Billing
      </Link>
      {can(session.data ?? null, "admin:view") ? (
        <Link
          to="/admin/subscriptions"
          activeProps={NAV_LINK_ACTIVE}
          className={NAV_LINK}
          onClick={onNavigate}
        >
          Admin
        </Link>
      ) : null}
    </nav>
  );
}
