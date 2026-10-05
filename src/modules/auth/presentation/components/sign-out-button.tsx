import { LogOut } from "lucide-react";

import { Button } from "@/shared/ui/button";

import { useSignOut } from "../queries";

export function SignOutButton({
  variant = "ghost",
}: {
  variant?: "ghost" | "outline";
}) {
  const signOut = useSignOut();

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={signOut.isPending}
      onClick={() => {
        signOut.mutate();
      }}
    >
      <LogOut className="size-4" aria-hidden />
      {signOut.isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
