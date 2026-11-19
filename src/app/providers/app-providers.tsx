import { type ReactNode } from "react";

import { AuthDependenciesProvider } from "@/modules/auth";
import { PlaygroundDependenciesProvider } from "@/modules/playground";
import { RepositoriesDependenciesProvider } from "@/modules/repositories";
import { RunsDependenciesProvider } from "@/modules/runs";

import { type AppDependencies } from "../composition/dependencies";

/** Hands the modules their dependencies. The query client is provided by App. */
export function AppProviders({
  dependencies,
  children,
}: {
  dependencies: AppDependencies;
  children: ReactNode;
}) {
  return (
    <AuthDependenciesProvider value={dependencies.auth}>
      <RunsDependenciesProvider value={dependencies.runs}>
        <RepositoriesDependenciesProvider value={dependencies.repositories}>
          <PlaygroundDependenciesProvider value={dependencies.playground}>
            {children}
          </PlaygroundDependenciesProvider>
        </RepositoriesDependenciesProvider>
      </RunsDependenciesProvider>
    </AuthDependenciesProvider>
  );
}
