import { createDependencyContext } from "@/shared/di/create-dependency-context";

import { type RunsDependencies } from "../application/use-cases";

const context = createDependencyContext<RunsDependencies>("Runs");

export const RunsDependenciesProvider = context.Provider;
export const useRunsDependencies = context.useDependencies;
