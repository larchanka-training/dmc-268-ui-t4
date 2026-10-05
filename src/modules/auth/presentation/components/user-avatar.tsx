import { cn } from "cn";

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter((part) => part !== "")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return letters === "" ? "?" : letters;
}

/** A GitHub avatar, or the initials when the API sent no usable (https) image. */
export function UserAvatar({
  url,
  name,
  className,
}: {
  url: string | null;
  name: string;
  className?: string;
}) {
  return url === null ? (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-surface-muted text-xs font-medium text-content-muted",
        className,
      )}
    >
      {initials(name)}
    </span>
  ) : (
    <img
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      className={cn("rounded-full", className)}
    />
  );
}
