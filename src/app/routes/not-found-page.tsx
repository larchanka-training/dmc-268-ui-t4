import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";

import { FallbackLayout } from "./fallback-layout";

/** Shown for an address that matches no route. */
export function NotFoundPage() {
  return (
    <FallbackLayout
      title="Page not found"
      description="This address does not match any page of the console."
    >
      <Button asChild>
        <Link to="/runs">Go to runs</Link>
      </Button>
    </FallbackLayout>
  );
}
