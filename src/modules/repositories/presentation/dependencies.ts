import { createDependencyContext } from "@/shared/di/create-dependency-context";

import { type RepositoriesDependencies } from "../application/use-cases";

const context =
  createDependencyContext<RepositoriesDependencies>("Repositories");

export const RepositoriesDependenciesProvider = context.Provider;
export const useRepositoriesDependencies = context.useDependencies;
