import { type ReactNode } from "react";

/** The shared frame of the error and not-found pages: a title, a sentence, actions. */
export function FallbackLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-content-muted">{description}</p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
