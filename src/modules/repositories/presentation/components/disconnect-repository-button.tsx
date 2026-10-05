import { Loader2, Unplug } from "lucide-react";
import { useState } from "react";

import { can, useSession } from "@/modules/auth";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { type Repository } from "../../domain/repository";
import { DisconnectFailure, useDisconnectRepository } from "../queries";

/**
 * Removing a repository happens on GitHub, so this only confirms the intent and hands the
 * owner over. Members get nothing to click: GitHub would refuse them, and the owners-only
 * hint next to "Connect repository" already says why.
 */
export function DisconnectRepositoryButton({
  repository,
}: {
  repository: Repository;
}) {
  const session = useSession();
  const disconnect = useDisconnectRepository();
  const [isOpen, setIsOpen] = useState(false);

  if (!can(session.data ?? null, "repositories:disconnect")) {
    return null;
  }

  const failure =
    disconnect.error instanceof DisconnectFailure
      ? disconnect.error.reason
      : null;

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);

        if (!open) {
          disconnect.reset();
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Disconnect ${repository.fullName}`}
        >
          <Unplug className="size-4" aria-hidden />
          Disconnect
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogTitle>{`Disconnect ${repository.fullName}?`}</AlertDialogTitle>
        <AlertDialogDescription>
          The review app will stop reviewing its pull requests. You remove the
          repository on GitHub, in the app&apos;s installation settings:
          unselect it there and save.
        </AlertDialogDescription>
        <p className="text-xs text-content-muted">
          If the app has access to all repositories, switch it to “Only select
          repositories” first. To remove the last repository, uninstall the app
          on GitHub.
        </p>

        {failure === null ? null : (
          <p role="alert" className="text-sm">
            {failure === "not-found"
              ? "This repository is no longer connected."
              : "Could not open GitHub."}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">
              {failure === "not-found" ? "Close" : "Cancel"}
            </Button>
          </AlertDialogCancel>
          {failure === "not-found" ? null : (
            <Button
              disabled={disconnect.isPending}
              onClick={() => {
                disconnect.mutate(repository.id);
              }}
            >
              {disconnect.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {failure === null ? "Continue on GitHub" : "Retry"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
