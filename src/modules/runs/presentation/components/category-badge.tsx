import { type FindingCategory } from "../../domain/finding";

export function CategoryBadge({ category }: { category: FindingCategory }) {
  return (
    <span className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-[10px] text-content-muted">
      {category}
    </span>
  );
}
