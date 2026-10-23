import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

/** Picks the branch, tag or SHA whose rules.md to preview. Empty means the default branch. */
export function RulesRefForm({
  value,
  defaultBranch,
  onSubmit,
}: {
  value: string;
  defaultBranch: string;
  onSubmit: (ref: string | undefined) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const ref = draft.trim();

        onSubmit(ref === "" || ref === defaultBranch ? undefined : ref);
      }}
    >
      <label htmlFor="rules-ref" className="text-sm text-content-muted">
        Branch
      </label>
      <Input
        id="rules-ref"
        className="w-56"
        value={draft}
        placeholder={defaultBranch}
        maxLength={255}
        spellCheck={false}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
      />
      <Button type="submit" variant="outline" size="sm">
        Show rules
      </Button>
    </form>
  );
}
