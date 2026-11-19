import { type RuleCategory } from "../../domain/draft-rules";

/** The category a recognised section gives its rules; "guidance" for any other section. */
export function RuleCategoryBadge({
  category,
}: {
  category: RuleCategory | null;
}) {
  return (
    <span className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-[10px] text-content-muted">
      {category ?? "guidance"}
    </span>
  );
}
